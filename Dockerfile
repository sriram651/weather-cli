ARG GO_VERSION=1
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN go build -v -o /run-app ./server


FROM debian:bookworm

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /run-app /usr/local/bin/
COPY --from=builder /usr/src/app/locations /locations
COPY --from=builder /usr/src/app/weather_codes /weather_codes
WORKDIR /
CMD ["run-app"]
