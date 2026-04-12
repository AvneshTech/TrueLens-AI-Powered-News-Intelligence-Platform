FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# sirf backend copy karo
COPY backend ./backend

WORKDIR /app/backend

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk

WORKDIR /app

# correct path se jar copy karo
COPY --from=build /app/backend/target/app.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]