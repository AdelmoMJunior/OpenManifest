import os
import ctypes
import json
from app.models import Tenant

class ACBrLibNFeMT:
    def __init__(self):
        # A API lerá o path da var de ambiente (mapeada no docker-compose)
        lib_path = os.environ.get("ACBR_LIB_PATH", "./acbr_linux/libacbrnfe64.so")
        
        try:
            self.acbr = ctypes.CDLL(lib_path)
        except Exception as e:
            print(f"Erro ao carregar ACBrLib em {lib_path}: {e}")
            raise e
            
        self.handle = ctypes.c_void_p()
        
    def inicializar(self, tenant: Tenant):
        # Criar pasta para inis se nao existir
        ini_dir = os.path.join(os.getcwd(), "inis")
        os.makedirs(ini_dir, exist_ok=True)
        
        # Path do INI exclusivo para este tenant
        self.ini_path = os.path.join(ini_dir, f"acbr_{tenant.cnpj}.ini")
        
        # Chave de criptografia parametrizada pelo ambiente
        chave_cripto = os.environ.get("ACBR_PASS_KEY", "padrao_inseguro_123")
        
        ret = self.acbr.NFE_Inicializar(
            ctypes.byref(self.handle),
            self.ini_path.encode("utf-8"),
            chave_cripto.encode("utf-8")
        )
        
        if ret != 0:
            raise Exception(f"Erro ao inicializar ACBrLib (Cod: {ret})")
            
        # Configuracoes basicas apos inicializar
        self._configurar_tenant(tenant)
        
    def _configurar_tenant(self, tenant: Tenant):
        # Configurar ambiente, logs e caminhos
        app_path = "/app"
        path_schemas = os.path.join(app_path, "acbr_linux", "Schemas", "NFe")
        path_servicos = os.path.join(app_path, "acbr_linux", "ACBrNFeServicos.ini")
        cnpj = tenant.cnpj
        data_base = os.path.join(app_path, "acbr_data", cnpj)
        os.makedirs(data_base, exist_ok=True)
        
        path_nfe = os.path.join(data_base, "NFe")
        path_inu = os.path.join(data_base, "Inu")
        path_evento = os.path.join(data_base, "Evento")
        path_mun = os.path.join(data_base, "Municipio")
        path_down = os.path.join(data_base, "Download")
        
        for p in [path_nfe, path_inu, path_evento, path_mun, path_down]:
            os.makedirs(p, exist_ok=True)

        configs = [
            ("Principal", "TipoResposta", "1"), # 1 = XML, 0 = XML, 2 = JSON
            ("Principal", "CodificacaoResposta", "0"), # 0 = UTF8
            ("Principal", "LogNivel", "4"),
            # Paths NFE
            ("NFe", "PathSchemas", path_schemas),
            ("NFe", "IniServicos", path_servicos),
            ("NFe", "PathSalvar", data_base),
            # Configurações de Resposta
            ("Principal", "TipoResposta", "2"), # 2 = JSON
            ("Principal", "CodificacaoResposta", "0"), # 0 = UTF8
            ("Principal", "LogNivel", "4"),
            ("Principal", "LogPath", os.path.join(app_path, "logs")),
            
            # Dados Emitente / DFe
            ("DFe", "UF", tenant.uf or "BA"),
            ("DFe", "SSLLib", "1"),
            ("DFe", "SSLCryptLib", "1"),
            ("DFe", "SSLHttpLib", "3"),
            ("DFe", "SSLXmlSignLib", "4"),
            ("DFe", "SSLType", "5"), # LT_TLSv1_2
            ("DFe", "SSLVerificarCertificado", "0"),
            ("WebService", "VerificarValidade", "0"),
            
            # 0=taProducao, 1=taHomologacao
            ("NFe", "Ambiente", "0"),
            ("NFe", "SalvarWS", "1"),
            ("NFe", "Timeout", "30000"),
            
            # 3 = ve400, 0 = moNFe
            ("NFe", "VersaoDF", "3"),
            ("NFe", "ModeloDF", "0"),
            ("NFe", "ExibirErroSchema", "1"),
        ]
        
        cert_path = getattr(tenant, "certificado_temp_path", None)
        if cert_path:
            self.temp_cert_path = cert_path # Armazena na classe para o finalizar() conseguir excluir
            configs.append(("DFe", "ArquivoPFX", cert_path))
            if tenant.certificado_senha:
                configs.append(("DFe", "Senha", tenant.certificado_senha))
                
        # Emitente
        configs.append(("Emissor", "CNPJ", tenant.cnpj))
        configs.append(("Emissor", "RazaoSocial", tenant.razao_social or ""))
        configs.append(("Emissor", "NomeFantasia", tenant.nome_fantasia or "FANTASIA TESTE"))
        
        for secao, chave, valor in configs:
            self.acbr.NFE_ConfigGravarValor(
                self.handle,
                secao.encode("utf-8"),
                chave.encode("utf-8"),
                valor.encode("utf-8")
            )
            
        # Forca gravar no INI
        self.acbr.NFE_ConfigGravar(self.handle, self.ini_path.encode("utf-8"))

    def _obter_retorno(self, buffer_size=8192):
        s_resp = ctypes.create_string_buffer(buffer_size)
        es_tam = ctypes.c_ulong(buffer_size)
        self.acbr.NFE_UltimoRetorno(self.handle, s_resp, ctypes.byref(es_tam))
        return s_resp.value.decode("utf-8", errors="replace")
        
    def status_servico(self):
        s_resp = ctypes.create_string_buffer(64 * 1024)
        es_tam = ctypes.c_ulong(64 * 1024)
        ret = self.acbr.NFE_StatusServico(self.handle, s_resp, ctypes.byref(es_tam))
        
        if ret == 0:
            return True, s_resp.value.decode("utf-8", errors="replace")
        else:
            return False, self._obter_retorno(64 * 1024)

    # ====== Distribuicao ======
    def distribuicao_por_nsu(self, uf_autor: str, cnpj: str, nsu: str):
        s_resp = ctypes.create_string_buffer(256 * 1024)
        es_tam = ctypes.c_ulong(256 * 1024)
        # NFE_DistribuicaoDFePorNSU(handle, AcUFAutor, ACNPJCPF, eNSU, sResposta, esTamanho)
        ret = self.acbr.NFE_DistribuicaoDFePorNSU(
            self.handle,
            ctypes.c_int(self._uf_to_int(uf_autor)),
            cnpj.encode("utf-8"),
            nsu.encode("utf-8"),
            s_resp,
            ctypes.byref(es_tam)
        )
        return ret, self._obter_retorno(es_tam.value if es_tam.value > 256 * 1024 else 256 * 1024)

    def distribuicao_por_ult_nsu(self, uf_autor: str, cnpj: str, ult_nsu: str):
        s_resp = ctypes.create_string_buffer(256 * 1024)
        es_tam = ctypes.c_ulong(256 * 1024)
        ret = self.acbr.NFE_DistribuicaoDFePorUltNSU(
            self.handle,
            ctypes.c_int(self._uf_to_int(uf_autor)),
            cnpj.encode("utf-8"),
            ult_nsu.encode("utf-8"),
            s_resp,
            ctypes.byref(es_tam)
        )
        return ret, self._obter_retorno(es_tam.value if es_tam.value > 256 * 1024 else 256 * 1024)
        
    def distribuicao_por_chave(self, uf_autor: str, cnpj: str, chave: str):
        s_resp = ctypes.create_string_buffer(256 * 1024)
        es_tam = ctypes.c_ulong(256 * 1024)
        ret = self.acbr.NFE_DistribuicaoDFePorChave(
            self.handle,
            ctypes.c_int(self._uf_to_int(uf_autor)),
            cnpj.encode("utf-8"),
            chave.encode("utf-8"),
            s_resp,
            ctypes.byref(es_tam)
        )
        return ret, self._obter_retorno(es_tam.value if es_tam.value > 256 * 1024 else 256 * 1024)
        
    # ====== Eventos ======
    def enviar_evento(self, id_lote: int):
        s_resp = ctypes.create_string_buffer(8192)
        es_tam = ctypes.c_ulong(8192)
        # NFE_EnviarEvento(handle, idLote, sResposta, esTamanho)
        ret = self.acbr.NFE_EnviarEvento(
            self.handle,
            ctypes.c_int(id_lote),
            s_resp,
            ctypes.byref(es_tam)
        )
        return ret, self._obter_retorno(es_tam.value if es_tam.value > 8192 else 8192)
        
    def limpar_lista_eventos(self):
        self.acbr.NFE_LimparListaEventos(self.handle)
        
    def carregar_evento_ini(self, evento_ini: str):
        self.acbr.NFE_CarregarEventoINI(self.handle, evento_ini.encode("utf-8"))

    # ====== Envio NFe ======
    def limpar_lista(self):
        self.acbr.NFE_LimparLista(self.handle)
        
    def carregar_ini(self, ini_content: str):
        ret = self.acbr.NFE_CarregarINI(self.handle, ini_content.encode("utf-8"))
        if ret != 0:
            raise Exception(f"Erro ao carregar INI da Nota: {self._obter_retorno()}")

    def carregar_xml(self, xml_content: str):
        ret = self.acbr.NFE_CarregarXML(self.handle, xml_content.encode("utf-8"))
        if ret != 0:
            raise Exception(f"Erro ao carregar XML da Nota: {self._obter_retorno()}")

    def assinar(self):
        ret = self.acbr.NFE_Assinar(self.handle)
        if ret != 0:
            raise Exception(f"Erro ao assinar Nota: {self._obter_retorno()}")

    def enviar(self, lote: int):
        s_resp = ctypes.create_string_buffer(256 * 1024)
        es_tam = ctypes.c_ulong(256 * 1024)
        # NFE_Enviar(handle, ALote, Imprimir, Sincrono, Zipado, sResposta, esTamanho)
        ret = self.acbr.NFE_Enviar(
            self.handle,
            ctypes.c_int(lote),
            False, # Imprimir
            True,  # Sincrono
            False, # Zipado
            s_resp,
            ctypes.byref(es_tam)
        )
        return ret, self._obter_retorno(es_tam.value if es_tam.value > 256 * 1024 else 256 * 1024)

    def finalizar(self):
        if self.handle:
            self.acbr.NFE_Finalizar(self.handle)
            self.handle = None
            
        # Seguranca: Apagar o certificado temporário do disco após usar
        if hasattr(self, "temp_cert_path") and self.temp_cert_path:
            if os.path.exists(self.temp_cert_path):
                try:
                    os.remove(self.temp_cert_path)
                except Exception as e:
                    print(f"Erro ao excluir cert temporario {self.temp_cert_path}: {e}")
            
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.finalizar()

    # --- Utils ---
    def _uf_to_int(self, uf: str):
        ufs = {
            "RO": 11, "AC": 12, "AM": 13, "RR": 14, "PA": 15, "AP": 16, "TO": 17,
            "MA": 21, "PI": 22, "CE": 23, "RN": 24, "PB": 25, "PE": 26, "AL": 27, "SE": 28, "BA": 29,
            "MG": 31, "ES": 32, "RJ": 33, "SP": 35,
            "PR": 41, "SC": 42, "RS": 43,
            "MS": 50, "MT": 51, "GO": 52, "DF": 53
        }
        return ufs.get(uf.upper(), 29) # Default BA
