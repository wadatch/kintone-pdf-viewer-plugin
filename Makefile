.PHONY: build clean

# 変数定義
PLUGIN_NAME := pdf-viewer-plugin
PLUGIN_VERSION := $(shell grep '"version"' manifest.json | cut -d'"' -f4)
PPK_FILE ?= ppk/kdchpedpacegbomlohdplpofmohlihpi.ppk
DIST_DIR := dist
ZIP_FILE := plugin.zip

# デフォルトターゲット
all: build

# ビルド
build: clean
	@echo "Building $(PLUGIN_NAME) v$(PLUGIN_VERSION)..."
	@mkdir -p $(DIST_DIR)
	@kintone-plugin-packer --ppk $(PPK_FILE) --out $(DIST_DIR)/$(PLUGIN_NAME).zip .
	@echo "Created $(DIST_DIR)/$(PLUGIN_NAME).zip"

# クリーン
clean:
	@echo "Cleaning up..."
	@rm -rf $(DIST_DIR)
	@rm -f $(ZIP_FILE)
	@echo "Clean complete"

# ヘルプ
help:
	@echo "Available targets:"
	@echo "  build  - Build the plugin using kintone-plugin-packer (creates $(DIST_DIR)/$(PLUGIN_NAME).zip)"
	@echo "  clean  - Remove build artifacts"
	@echo "  help   - Show this help message" 