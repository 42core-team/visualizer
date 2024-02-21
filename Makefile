IMAGE_NAME = registry.coregame.de/core/visualizer
IMAGE_TAG = latest

run: build
	docker run --rm --name visualizer -p 3000:3000 $(IMAGE_NAME):$(IMAGE_TAG)
	@echo "Visualizer is running on http://localhost:3000"

build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

push: build
	docker push $(IMAGE_NAME):$(IMAGE_TAG)
