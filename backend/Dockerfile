FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# only backend copy
COPY backend /app

RUN mvn clean package -DskipTests

FROM eclipse-temurin:23-jdk

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

CMD ["java", "-jar", "app.jar"]