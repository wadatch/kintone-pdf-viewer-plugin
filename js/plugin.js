(function () {
  'use strict';

  // モバイル端末かどうかを判定
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // モバイル端末の場合は機能を無効化
  if (isMobile()) {
    console.log('PDF Viewer Plugin: モバイル端末のため機能を無効化します');
    return;
  }

  // PDF.jsのワーカーを設定
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // プラグインの初期化
  kintone.events.on('app.record.detail.show', function (event) {
    console.log('PDF Viewer Plugin: プラグインが初期化されました');
    return event;
  });

  // ダウンロードアイコンを作成する関数
  function createDownloadIcon(anchor) {
    const downloadIcon = document.createElement('span');
    downloadIcon.className = 'pdf-download-icon';
    downloadIcon.style.cssText = `
      margin-left: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
      background-color: #f8f9fa;
    `;
    downloadIcon.title = 'PDFをダウンロード';
    
    // ホバー時のスタイル
    downloadIcon.addEventListener('mouseover', function() {
      this.style.backgroundColor = '#e9ecef';
    });
    downloadIcon.addEventListener('mouseout', function() {
      this.style.backgroundColor = '#f8f9fa';
    });
    
    downloadIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="none"></path>
        <polyline points="7 10 12 15 17 10" fill="none"></polyline>
        <line x1="12" y1="15" x2="12" y2="3" fill="none"></line>
      </svg>
    `;
    
    // ダウンロードアイコンのクリックイベント
    downloadIcon.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('PDF Viewer Plugin: ダウンロードアイコンがクリックされました');

      try {
        // URLからファイル情報を抽出
        const url = new URL(anchor.href);
        const params = new URLSearchParams(url.search);
        const app = params.get('app');
        const field = params.get('field');
        const record = params.get('record');
        const id = params.get('id');
        
        if (!app || !field || !record || !id) {
          console.error('PDF Viewer Plugin: 必要なパラメータが見つかりません');
          window.location.href = anchor.href;
          return;
        }

        // レコードからファイル情報を取得
        const recordResp = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
          app: app,
          id: record
        });

        if (!recordResp || !recordResp.record) {
          console.error('PDF Viewer Plugin: レコードの取得に失敗しました');
          window.location.href = anchor.href;
          return;
        }

        if (!recordResp.record[field]) {
          console.error(`PDF Viewer Plugin: フィールド "${field}" が見つかりません`);
          window.location.href = anchor.href;
          return;
        }

        if (!recordResp.record[field].value) {
          console.error(`PDF Viewer Plugin: フィールド "${field}" に値がありません`);
          window.location.href = anchor.href;
          return;
        }

        const fileInfo = recordResp.record[field].value.find(file => file.fileKey === id);
        if (!fileInfo) {
          console.error('PDF Viewer Plugin: ファイル情報が見つかりません');
          window.location.href = anchor.href;
          return;
        }

        // ファイルを取得
        const fileResp = await kintone.api(kintone.api.url('/k/v1/file', true), 'GET', {
          fileKey: fileInfo.fileKey
        });

        // Base64エンコードされたPDFデータをBlobに変換
        const binary = atob(fileResp);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: 'application/pdf' });
        
        // ダウンロードリンクを作成して自動クリック
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileInfo.name;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);

      } catch (error) {
        console.error('PDF Viewer Plugin: ダウンロード処理でエラーが発生しました', error);
        // エラーが発生した場合は、直接URLを使用してダウンロードを試みる
        window.location.href = anchor.href;
      }
    });

    return downloadIcon;
  }

  // PDFリンクにイベントリスナーを設定する関数
  function setupPDFLinks() {
    console.log('PDF Viewer Plugin: PDFリンクの設定を開始します');
    // レコード詳細画面のファイルリンク
    const fileLinks = document.querySelectorAll('.control-file-field-gaia a');
    // アプリ一覧画面のファイルリンク
    const appListFileLinks = document.querySelectorAll('.gaia-argoui-app-list-file a');
    // レコード一覧画面のファイルリンク
    const recordListFileLinks = document.querySelectorAll('.recordlist-file-others-gaia a');
    
    console.log('PDF Viewer Plugin: 検出されたファイルリンク数:', 
      fileLinks.length + appListFileLinks.length + recordListFileLinks.length);

    // レコード詳細画面のリンクを設定
    fileLinks.forEach((anchor, index) => {
      console.log(`PDF Viewer Plugin: リンク ${index + 1} のURL:`, anchor.href);
      if (anchor.href.endsWith('.pdf')) {
        console.log(`PDF Viewer Plugin: PDFリンクを検出: ${anchor.href}`);
        // 既存のイベントリスナーを削除
        anchor.removeEventListener('click', handlePDFClick);
        // 新しいイベントリスナーを追加
        anchor.addEventListener('click', handlePDFClick);
        // ダウンロードアイコンを追加
        const downloadIcon = createDownloadIcon(anchor);
        anchor.parentNode.insertBefore(downloadIcon, anchor.nextSibling);
      }
    });

    // アプリ一覧画面のリンクを設定
    appListFileLinks.forEach((anchor, index) => {
      console.log(`PDF Viewer Plugin: アプリ一覧のリンク ${index + 1} のURL:`, anchor.href);
      if (anchor.href.endsWith('.pdf')) {
        console.log(`PDF Viewer Plugin: アプリ一覧のPDFリンクを検出: ${anchor.href}`);
        // 既存のイベントリスナーを削除
        anchor.removeEventListener('click', handlePDFClick);
        // 新しいイベントリスナーを追加
        anchor.addEventListener('click', handlePDFClick);
        // ダウンロードアイコンを追加
        const downloadIcon = createDownloadIcon(anchor);
        anchor.parentNode.insertBefore(downloadIcon, anchor.nextSibling);
      }
    });

    // レコード一覧画面のリンクを設定
    recordListFileLinks.forEach((anchor, index) => {
      console.log(`PDF Viewer Plugin: レコード一覧のリンク ${index + 1} のURL:`, anchor.href);
      if (anchor.href.endsWith('.pdf')) {
        console.log(`PDF Viewer Plugin: レコード一覧のPDFリンクを検出: ${anchor.href}`);
        // 既存のイベントリスナーを削除
        anchor.removeEventListener('click', handlePDFClick);
        // 新しいイベントリスナーを追加
        anchor.addEventListener('click', handlePDFClick);
        // ダウンロードアイコンを追加
        const downloadIcon = createDownloadIcon(anchor);
        anchor.parentNode.insertBefore(downloadIcon, anchor.nextSibling);
      }
    });
  }

  // PDFリンクのクリックハンドラー
  function handlePDFClick(e) {
    console.log('PDF Viewer Plugin: PDFリンクがクリックされました');
    e.preventDefault();
    e.stopPropagation();

    // URLからファイル情報を抽出
    const url = new URL(this.href);
    const params = new URLSearchParams(url.search);
    const app = params.get('app');
    const field = params.get('field');
    const record = params.get('record');
    const id = params.get('id');
    
    if (!app || !field || !record || !id) {
      console.error('PDF Viewer Plugin: 必要なパラメータが見つかりません');
      return;
    }

    // レコードからファイル情報を取得
    kintone.api(kintone.api.url('/k/v1/record', true), 'GET', {
      app: app,
      id: record
    }).then(function(resp) {
      console.log('PDF Viewer Plugin: レコードの取得に成功しました');
      const fileInfo = resp.record[field].value.find(file => file.fileKey === id);
      
      if (!fileInfo) {
        console.error('PDF Viewer Plugin: ファイル情報が見つかりません');
        return;
      }

      // ファイルを取得
      return kintone.api(kintone.api.url('/k/v1/file', true), 'GET', {
        fileKey: fileInfo.fileKey
      });
    }).then(function(resp) {
      if (!resp) return;
      
      console.log('PDF Viewer Plugin: PDFの取得に成功しました');
      // Base64エンコードされたPDFデータをBlobに変換
      const binary = atob(resp);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      showPDFModal(url);
    }).catch(function(error) {
      console.error('PDF Viewer Plugin: ファイルの取得に失敗しました', error);
      // エラーが発生した場合は、直接URLを使用して表示を試みる
      console.log('PDF Viewer Plugin: 直接URLを使用して表示を試みます');
      showPDFModal(this.href);
    }.bind(this));
  }

  // レコード詳細画面の表示時
  kintone.events.on('app.record.detail.show', function (event) {
    console.log('PDF Viewer Plugin: レコード詳細画面が表示されました');
    
    // DOMの読み込み完了を待ってから実行
    setTimeout(function() {
      setupPDFLinks();
    }, 1000);

    return event;
  });

  // レコード一覧画面の表示時
  kintone.events.on('app.record.index.show', function (event) {
    console.log('PDF Viewer Plugin: レコード一覧画面が表示されました');
    setTimeout(function() {
      setupPDFLinks();
    }, 1000);
    return event;
  });

  // レコード編集画面の表示時
  kintone.events.on('app.record.edit.show', function (event) {
    console.log('PDF Viewer Plugin: レコード編集画面が表示されました');
    setTimeout(function() {
      setupPDFLinks();
    }, 1000);
    return event;
  });

  // アプリ一覧画面の表示時
  kintone.events.on('app.index.show', function (event) {
    console.log('PDF Viewer Plugin: アプリ一覧画面が表示されました');
    setTimeout(function() {
      setupPDFLinks();
    }, 1000);
    return event;
  });

  function showPDFModal(pdfUrl) {
    console.log('PDF Viewer Plugin: モーダル表示を開始します');
    console.log('PDF Viewer Plugin: PDF URL:', pdfUrl);

    const existingModal = document.getElementById('kintone-pdf-modal');
    if (existingModal) {
      console.log('PDF Viewer Plugin: 既存のモーダルを削除します');
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'kintone-pdf-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      position: relative;
      width: 90%;
      height: 90%;
      display: flex;
      flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
    `;

    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    const buttonStyle = `
      padding: 5px 10px;
      border: 1px solid #ccc;
      border-radius: 3px;
      background: white;
      cursor: pointer;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
    `;

    const rotateButton = document.createElement('button');
    rotateButton.textContent = '↻';
    rotateButton.style.cssText = buttonStyle;
    rotateButton.title = '回転';

    const downloadButton = document.createElement('button');
    downloadButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="none"></path>
        <polyline points="7 10 12 15 17 10" fill="none"></polyline>
        <line x1="12" y1="15" x2="12" y2="3" fill="none"></line>
      </svg>
    `;
    downloadButton.style.cssText = buttonStyle;
    downloadButton.title = 'ダウンロード';

    const zoomInButton = document.createElement('button');
    zoomInButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    `;
    zoomInButton.style.cssText = buttonStyle;
    zoomInButton.title = '拡大';

    const zoomOutButton = document.createElement('button');
    zoomOutButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    `;
    zoomOutButton.style.cssText = buttonStyle;
    zoomOutButton.title = '縮小';

    const prevPageButton = document.createElement('button');
    prevPageButton.textContent = '←';
    prevPageButton.style.cssText = buttonStyle;
    prevPageButton.title = '前のページ';

    const nextPageButton = document.createElement('button');
    nextPageButton.textContent = '→';
    nextPageButton.style.cssText = buttonStyle;
    nextPageButton.title = '次のページ';

    const pageInfo = document.createElement('span');
    pageInfo.style.cssText = `
      margin: 0 10px;
      min-width: 80px;
      text-align: center;
    `;

    const closeButton = document.createElement('button');
    closeButton.id = 'modal-close';
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      border: none;
      background: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const pdfContainer = document.createElement('div');
    pdfContainer.style.cssText = `
      flex: 1;
      position: relative;
      overflow: auto;
      background-color: #f0f0f0;
    `;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      margin: 0 auto;
      display: block;
    `;

    header.appendChild(controls);
    controls.appendChild(rotateButton);
    controls.appendChild(downloadButton);
    controls.appendChild(zoomOutButton);
    controls.appendChild(zoomInButton);
    controls.appendChild(prevPageButton);
    controls.appendChild(pageInfo);
    controls.appendChild(nextPageButton);
    header.appendChild(closeButton);
    pdfContainer.appendChild(canvas);
    modalContent.appendChild(header);
    modalContent.appendChild(pdfContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    console.log('PDF Viewer Plugin: モーダルを表示しました');

    let currentPage = 1;
    let currentScale = 1.0;
    let pdfDoc = null;

    // PDFの読み込みと表示
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise.then(function(pdf) {
      pdfDoc = pdf;
      console.log('PDF Viewer Plugin: PDFの読み込みに成功しました');
      renderPage(currentPage);
    }).catch(function(error) {
      console.error('PDF Viewer Plugin: PDFの読み込みに失敗しました', error);
      pdfContainer.innerHTML = '<div style="text-align: center; padding: 20px;">PDFの読み込みに失敗しました</div>';
    });

    function renderPage(pageNumber) {
      if (!pdfDoc) {
        console.error('PDF Viewer Plugin: PDFドキュメントが読み込まれていません');
        return;
      }

      pdfDoc.getPage(pageNumber).then(function(page) {
        const viewport = page.getViewport({ scale: currentScale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport: viewport
        };

        page.render(renderContext).promise.then(function() {
          pageInfo.textContent = `ページ ${pageNumber} / ${pdfDoc.numPages}`;
        }).catch(function(error) {
          console.error('PDF Viewer Plugin: ページのレンダリングに失敗しました', error);
        });
      }).catch(function(error) {
        console.error('PDF Viewer Plugin: ページの取得に失敗しました', error);
      });
    }

    zoomInButton.addEventListener('click', function() {
      currentScale += 0.2;
      renderPage(currentPage);
    });

    zoomOutButton.addEventListener('click', function() {
      if (currentScale > 0.4) {
        currentScale -= 0.2;
        renderPage(currentPage);
      }
    });

    // 回転ボタンのイベントリスナー
    let rotation = 0;
    rotateButton.addEventListener('click', function() {
      rotation = (rotation + 90) % 360;
      canvas.style.transform = `rotate(${rotation}deg)`;
    });

    // ダウンロードボタンのイベントリスナー
    downloadButton.addEventListener('click', function() {
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = 'document.pdf';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });

    // ページングボタンのイベントリスナー
    prevPageButton.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
    });

    nextPageButton.addEventListener('click', function() {
      if (currentPage < pdfDoc.numPages) {
        currentPage++;
        renderPage(currentPage);
      }
    });

    closeButton.addEventListener('click', function() {
      console.log('PDF Viewer Plugin: モーダルを閉じます');
      if (loadingTask) {
        loadingTask.destroy();
      }
      modal.remove();
      // Blob URLを解放
      if (pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    });
  }
})();