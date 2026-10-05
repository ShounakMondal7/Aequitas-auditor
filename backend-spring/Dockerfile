# Base Image: Eclipse Temurin Java 17 on Ubuntu Jammy
FROM eclipse-temurin:17-jdk-jammy

# Set non-interactive debian frontend for clean automated installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Python 3, pip, Maven, and essential system libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-dev \
        maven \
        build-essential \
        curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Step 1: Install Python AI Engine dependencies with layer caching
COPY engine/ /app/engine/
RUN pip3 install --no-cache-dir -r /app/engine/requirements.txt --break-system-packages || \
    pip3 install --no-cache-dir -r /app/engine/requirements.txt

# Step 2: Pre-index RAG ChromaDB vector store
RUN python3 /app/engine/rag/vector_store.py || true

# Step 3: Copy Spring Boot backend source code & compile artifact
COPY backend-spring/pom.xml /app/backend-spring/
COPY backend-spring/src /app/backend-spring/src

WORKDIR /app/backend-spring
RUN mvn clean package -DskipTests && \
    cp target/*.jar /app/app.jar

# Configure default runtime environment variables
ENV SERVER_PORT=5000 \
    AGENT_ENGINE_PYTHON_PATH=python3 \
    AGENT_ENGINE_SCRIPT_PATH=/app/engine/agent.py \
    AGENT_ENGINE_WORKING_DIR=/app/engine \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=utf-8

WORKDIR /app
EXPOSE 5000

# Execute Spring Boot Application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]
