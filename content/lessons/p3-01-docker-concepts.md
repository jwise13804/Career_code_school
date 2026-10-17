---
title: "Docker: a sealed kit for your app"
minutes: 14
summary: Your code works on your laptop. Docker makes sure it works everywhere else too, by packing the code together with everything it needs.
goals:
  - Explain the "it works on my machine" problem
  - Tell the difference between a Dockerfile, an image and a container
  - Build and run a container (in the practice terminal)
---

## "It works on my machine"

You've probably heard of a fix that worked for one customer but not another, because their phone had a different app version. Code has the same problem. Your API might work on your laptop because you have Python 3.12 and the right libraries. A server with Python 3.9 and different libraries might crash.

**[[docker]]** solves this by packing your code *together with* everything it needs (the right Python, the right libraries, the settings) into one sealed bundle that runs the same everywhere.

```analogy
Think of sending a new card terminal to a merchant. You could post instructions ("install firmware 4.2, set the currency to GBP…") and hope they follow them. Or you could ship the terminal **already set up**, so it works out of the box. Docker is the pre-configured terminal.
```

## Three words to know

| Word | What it is | Comparison |
| --- | --- | --- |
| **Dockerfile** | A text file of step-by-step instructions | The recipe card |
| **[[image]]** | The sealed bundle Docker builds by following those steps | A meal kit, sealed and labelled |
| **[[container]]** | A running copy of an image | The meal, actually cooked and on the table |

You can run many containers from one image, the same way you can make the same meal kit many times.

## A Dockerfile, line by line

```text
FROM python:3.12-slim              # start from a small image with Python 3.12
WORKDIR /app                       # work inside a folder called /app
COPY requirements.txt .            # copy in the list of libraries
RUN pip install -r requirements.txt   # install them
COPY . .                           # copy in your code
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]  # how to start it
```

It reads top to bottom, like a call script. `FROM` says what to start with, `COPY` brings files in, `RUN` runs a command while building, and `CMD` says what to do when the container starts.

## Ports: the phone extension

Your API listens on **port 8000** *inside* the container. The container is sealed, so you have to connect a port on your computer to it: `-p 8000:8000` means "put calls to my 8000 through to the container's 8000". It's the same idea as a switchboard putting a call through to an extension.

## Try it

Docker needs to be installed to run for real, so here's a practice terminal with scripted answers. It understands the real commands and explains common mistakes.

```terminal
docker-basics
```

```quiz
p3-01-docker
```

## Practice this week

```practice
- Install **Docker Desktop** (free for personal use) using Docker's [Get Started guide](https://docs.docker.com/get-started/), and run the `hello-world` image. If your laptop can't run it, keep using the practice terminal. You'll still learn the concepts.
- Read the "What is a container?" and "What is an image?" pages of that guide (10 minutes each).
- Microsoft Learn's free [Introduction to Docker containers](https://learn.microsoft.com/training/modules/intro-to-docker-containers/) module is a good second explanation.
```

```video
{
  "title": "Docker: Get Started",
  "provider": "Docker docs (free, official)",
  "url": "https://docs.docker.com/get-started/",
  "minutes": 30,
  "why": "Official guide with short videos and a hands-on workshop you can do once Docker Desktop is installed."
}
```
