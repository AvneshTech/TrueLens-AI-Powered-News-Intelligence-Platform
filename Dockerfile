FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy the backend folder contents
COPY backend/pom.xml backend/
COPY backend/src backend/src/

# Build the JAR
RUN mvn clean package -DskipTests -f backend/pom.xml

FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy the built JAR from the backend target directory
COPY --from=build /app/backend/target/app.jar app.jar
RUN mkdir -p target && cp app.jar target/app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]