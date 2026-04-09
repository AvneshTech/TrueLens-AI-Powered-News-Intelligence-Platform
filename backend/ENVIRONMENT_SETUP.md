# TrueLens Backend - Environment Setup

## Environment Variables Configuration

For security reasons, sensitive configuration has been moved to environment variables. Follow these steps to set up your development environment:

### 1. Create Environment Configuration

Edit `src/main/resources/application-local.properties` with your actual values.

### 2. Required Environment Variables

If you want to use MySQL instead of the default in-memory H2 database, set the following values:

```properties
# Database Configuration
DB_USERNAME=root
DB_PASSWORD=your_actual_database_password

# API Keys (get from respective services)
NEWS_API_KEY=your_newsapi_org_key
HUGGINGFACE_API_KEY=your_huggingface_key

# JWT Configuration (generate a secure random string)
JWT_SECRET=your_secure_random_string_minimum_32_chars
```

### 3. How to Get API Keys

- **NewsAPI**: Sign up at https://newsapi.org/ and get your free API key
- **HuggingFace**: Create account at https://huggingface.co/ and generate an API token
- **Database**: Use your MySQL database credentials

### 4. Running the Application

Make sure to activate the `local` profile when running:

```bash
# Using Maven
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Or set environment variable
export SPRING_PROFILES_ACTIVE=local
mvn spring-boot:run
```

### 5. Security Notes

- Never commit `application-local.properties` to version control
- Use strong, unique passwords for database
- Generate a secure JWT secret (at least 32 characters)
- Rotate API keys regularly
- Use environment-specific configurations for production

### 6. Production Deployment

For production, set these environment variables in your deployment platform:
- `DB_USERNAME`
- `DB_PASSWORD`
- `NEWS_API_KEY`
- `HUGGINGFACE_API_KEY`
- `JWT_SECRET`

The application will use default values if environment variables are not set, but this is not recommended for production.