FROM python:3.12-slim

RUN mkdir -p /app

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    libblas-dev \
    liblapack-dev \
    gfortran \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt . 
RUN pip install pip==24.0
RUN pip install -r requirements.txt

COPY . .  
 
RUN cp /usr/share/zoneinfo/Europe/Athens /etc/localtime
RUN echo "Europe/Athens" >  /etc/timezone

RUN date

EXPOSE ${APP_PORT}

CMD ["python3", "main.py"] 

