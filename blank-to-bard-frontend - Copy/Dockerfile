# Set the base image. This image includes Node.js and NPM.
FROM node:14

# Set the working directory in the Docker container.
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files into the container.
# These files include the list of dependencies for your project.
COPY package*.json ./

# Install the dependencies in the container.
RUN npm install

# Copy the rest of your application's source code into the container.
COPY . .

# The port your application will use.
EXPOSE 3000

# The command to start your application.
CMD [ "npm", "start" ]
