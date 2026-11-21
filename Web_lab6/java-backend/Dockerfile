# Этап 1: Сборка (Maven)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

# Этап 2: Запуск (JRE)
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN mkdir -p /app/data && chown -R 10001:10001 /app
USER 10001
COPY --from=build --chown=10001:10001 /app/target/*.jar app.jar
EXPOSE 8000
CMD ["java", "-jar", "app.jar"]