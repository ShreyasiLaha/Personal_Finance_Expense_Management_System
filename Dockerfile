# Multi-stage build for lightweight container
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY src ./src
RUN mkdir bin && javac -encoding UTF-8 -d bin src/*.java

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/bin ./bin
COPY web ./web
COPY transactions.txt budgets.txt goals.txt ./

EXPOSE 8080
ENV PORT=8080

CMD ["java", "-cp", "bin", "Main"]
