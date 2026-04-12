# ---------- BUILD STAGE ----------
FROM maven:3.9.6-eclipse-temurin-23 AS build

WORKDIR /app
COPY . .

RUN mvn clean package -DskipTests

# ---------- RUN STAGE ----------
FROM eclipse-temurin:23-jdk

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

CMD ["java", "-jar", "app.jar"]