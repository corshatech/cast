ARG APP=collector

FROM golang:1.19 as build

ENV GO111MODULE=on

RUN mkdir -p /opt/$APP/bin

WORKDIR /opt/$APP

COPY ./go.mod .
COPY ./go.sum .

RUN go mod download

COPY collector ./collector
RUN go build -o ./bin ./collector

FROM registry.access.redhat.com/ubi8:8.7

WORKDIR /opt/$APP

RUN groupadd --gid 12345 CAST \
    && useradd --uid 12345 --gid 12345 CAST

COPY --from=build --chown=CAST /opt/$APP/bin ./bin
USER CAST

ENTRYPOINT [ "./bin/collector" ]
