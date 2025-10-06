# Video Metadata Management App

A backend service for managing video metadata (title, description, genres, and tags), uploads and file chunking.  
Built with **Node.js**, **Express**, **TypeORM**, **MySQL**, and **Redis**.

---

## Table of Contents
1. [Clone the Project](#-clone-the-project)
2. [Install Dependencies](#-install-dependencies)
3. [Setup Environment Variables](#-setup-environment-variables)
4. [Database & Redis Setup](#-database--redis-setup)
5. [Run Database Migrations](#-run-database-migrations)
6. [Run the Application](#-run-the-application)
7. [Postman API Documentation](#-postman-api-documentation)

---

## Clone the Project

To clone the repository, if using https, open your terminal and run:

```bash
cd ~
git clone https://github.com/Chiemelie10/video_metadata_management.git
cd video_metadata_management
```

If using ssh, open your terminal and run:

```bash
cd ~
git clone git@github.com:Chiemelie10/video_metadata_management.git
cd video_metadata_management
```

## Install Dependencies

To install, once inside the project root, video_metadata_management directory, run:

```bash
npm install
```

## Setup Environment Variables

Create a .env file in the project root (same level as package.json) and provide your configuration values. Use .env.example as a guide.

## Database & Redis Setup

Before running the app, ensure that:

1. MySQL is installed, running, and the database and its user specified in .env exists. Note that the user should be granted all privileges on the specified database.

2. Redis is installed and running (required for caching).

## Run Database Migrations

To create the necessary tables in your database, if using typescript, ensure NODE_ENV is set to "development" and run:

```bash
npx typeorm-ts-node-commonjs migration:run -d src/config/data-source.ts
```

If using the compiled JavaScript run:

```bash
typeorm migration:run -d build/config/data-source.js
```

## Run the Application

If NODE_ENV is set to development run:

```bash
npm run dev
```

If NODE_ENV is set to production run:

```bash
npm run build
npm start
```

## Postman API Documentation

To learn how to make requests to this API, click the following link to access the postman documentation: [text](https://web.postman.co/workspace/eb495735-3ec5-4300-8959-535296678023/documentation/29774581-e18c5449-dcea-4d35-92ae-b8791ec85156)
