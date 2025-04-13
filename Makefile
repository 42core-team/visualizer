IMAGE_NAME = ghcr.io/42core-team/visualizer
IMAGE_TAG = event-00

visualizer:
	go run main.go

container: build
	docker run --rm --name visualizer -p 3000:3000 $(IMAGE_NAME):$(IMAGE_TAG)
	@echo "Visualizer is running on http://localhost:3000"

build:
	docker buildx build --platform linux/amd64,linux/arm64/v8 -t $(IMAGE_NAME):$(IMAGE_TAG) .

push: build
	docker push $(IMAGE_NAME):$(IMAGE_TAG)
