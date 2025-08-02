FROM rust:bullseye AS chef

RUN cargo install cargo-chef
WORKDIR /bot

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /bot/recipe.json recipe.json

RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
RUN cargo build --release --bin fparma-bot

FROM debian:bullseye AS runtime
RUN apt-get update
RUN apt-get install ca-certificates openssh-client curl liblzo2-2 libvorbis0a libvorbisfile3 libvorbisenc2 libogg0 libuchardet0 -y

# Get Mikero Tools
RUN curl "https://mikero.bytex.digital/api/download?filename=depbo-tools-0.10.04-linux-amd64.tgz" -o depbo-tools-0.10.04-linux-amd64.tgz
RUN tar -xzf depbo-tools-0.10.04-linux-amd64.tgz
RUN mv depbo-tools-0.10.04/bin/* /usr/bin/
RUN mv depbo-tools-0.10.04/lib/* /usr/lib/
RUN rm -rf depbo-tools-0.10.04-linux-amd64.tgz
RUN rm -rf depbo-tools-0.10.04

COPY key /bot/key
COPY .env /bot/.env

RUN chmod 600 /bot/key

WORKDIR /bot

COPY --from=builder /bot/target/release/fparma-bot /usr/local/fparma-bot
ENTRYPOINT ["/usr/local/fparma-bot"]
