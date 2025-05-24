FROM python:3.12-alpine

RUN mkdir -p /app

WORKDIR /app

COPY requirements.txt . 
RUN pip install -r requirements.txt

COPY . .  
 
# RUN apk update

# RUN apk add ca-certificates curl tzdata

# RUN apk add gcc
# RUN apk add g++
# RUN apk add libsodium libsodium-dev 

RUN cp /usr/share/zoneinfo/Europe/Athens /etc/localtime
RUN echo "Europe/Athens" >  /etc/timezone

RUN date

EXPOSE ${APP_PORT}

CMD ["python3", "main.py"] 

