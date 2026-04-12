FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# ⚠️ ab root hi backend hai → direct copy karo
COPY . .

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY --from=build /app/target/app.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]