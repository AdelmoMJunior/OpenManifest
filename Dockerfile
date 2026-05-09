FROM ubuntu:24.04

# Evitar prompts interativos durante instalacao
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias do Python e ACBrLib
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libxml2 \
    libxml2-dev \
    libxmlsec1 \
    libxmlsec1-dev \
    libssl-dev \
    wget \
    curl \
    ca-certificates \
    xvfb \
    xauth \
    libgtk2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Instalar fontes Microsoft (requer aceitar EULA)
RUN apt-get update && \
    echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections && \
    apt-get install -y ttf-mscorefonts-installer \
    && rm -rf /var/lib/apt/lists/*

# Instalar libssl1.1 (Ubuntu 24.04 so tem a 3.0 por padrao, ACBr precisa da 1.1)
RUN wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.24_amd64.deb \
    && dpkg -i libssl1.1_1.1.1f-1ubuntu2.24_amd64.deb \
    && rm libssl1.1_1.1.1f-1ubuntu2.24_amd64.deb

# Criar Symlinks para ACBrLib encontrar as bibliotecas
RUN ln -sf /usr/lib/x86_64-linux-gnu/libssl.so.1.1 /usr/lib/x86_64-linux-gnu/libssl.so \
    && ln -sf /usr/lib/x86_64-linux-gnu/libcrypto.so.1.1 /usr/lib/x86_64-linux-gnu/libcrypto.so \
    && ln -sf /usr/lib/x86_64-linux-gnu/libxml2.so.2 /usr/lib/x86_64-linux-gnu/libxml2.so \
    && ln -sf /usr/lib/x86_64-linux-gnu/libxmlsec1.so.1 /usr/lib/x86_64-linux-gnu/libxmlsec1.so \
    && ln -sf /usr/lib/x86_64-linux-gnu/libxmlsec1-openssl.so.1 /usr/lib/x86_64-linux-gnu/libxmlsec1-openssl.so \
    && ldconfig

ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:/usr/lib64:$LD_LIBRARY_PATH

# Configurar OpenSSL para carregar o Legacy Provider (necessario para certificados PFX antigos)
RUN sed -i 's/\[provider_sect\]/\[provider_sect\]\nlegacy = legacy_sect\ndefault = default_sect/g' /etc/ssl/openssl.cnf \
    && sed -i 's/\[default_sect\]/\[default_sect\]\nactivate = 1/g' /etc/ssl/openssl.cnf \
    && echo "[legacy_sect]\nactivate = 1" >> /etc/ssl/openssl.cnf

# Instalar Certificados ICP-Brasil
RUN mkdir -p /usr/local/share/ca-certificates/icp-brasil \
    && curl -k -o /usr/local/share/ca-certificates/icp-brasil/v5.crt https://ccd.serpro.gov.br/lcr/AC_Raiz_Brasileira_v5.crt \
    && curl -k -o /usr/local/share/ca-certificates/icp-brasil/v10.crt https://ccd.serpro.gov.br/lcr/AC_Raiz_Brasileira_v10.crt \
    && update-ca-certificates

# Definir pasta de trabalho
WORKDIR /app

# Copiar requirements primeiro para cache do Docker
COPY requirements.txt .

# Instalar pacotes Python
RUN pip3 install -r requirements.txt --break-system-packages

# Copiar o restante do codigo para a imagem (Fallback caso o volume falhe)
COPY . .

# Criar pastas necessarias
RUN mkdir -p inis logs certs

# O restante do codigo podera ser sobrescrito via volume no docker-compose para desenvolvimento
