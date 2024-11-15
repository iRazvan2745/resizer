# Resize Iraz

This is a [Next.js 15](https://nextjs.org) project that provides a seamless image resizing experience. Users can upload images, resize them to specified dimensions or presets, and download the resized images.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 20 or higher)
- npm (comes with Node.js)
- Docker (optional, for containerization)
- Docker Compose (optional, for container orchestration)

### Installation

#### Using Docker Compose **(Recommended)**

To run the application in a Docker container using Docker Compose, follow these steps:

1. Create a `docker-compose.yml` file with the following content:

   ```yaml
   version: '3.8'
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       environment:
         UPSTASH_REDIS_URL: ${UPSTASH_REDIS_URL}
         UPSTASH_REDIS_TOKEN: ${UPSTASH_REDIS_TOKEN}
       volumes:
         - .:/app
       command: npm run devmode
   ```

2. Start the Docker container in detached mode:

   ```bash
   docker compose up -d
   ```

   The application will be available at `http://localhost:3000`.

### Stopping the Application

To stop the Docker container, run:

   ```bash
   docker compose down
   ```

#### Using npm

   1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/resize-irazz.git
   cd resizer-irazz
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

### Running the Application

To start the development server, run:

   ```bash
   npm run dev
   ```
