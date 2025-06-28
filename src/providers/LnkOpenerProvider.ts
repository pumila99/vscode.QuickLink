import * as vscode from 'vscode';
import { openLnkTargetPath } from '../utils/openLnkTarget'; // ★共通の処理をインポートするよ！

/**
 * .lnkファイル用のカスタムエディタプロバイダ
 * ファイルがクリック（またはEnter）されたときに、リンク先を開く処理を実行する
 */
export class LnkOpenerProvider implements vscode.CustomEditorProvider {

    onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<vscode.CustomDocument>>().event;

    // ファイルが開かれたときに呼び出される
    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel, // 今回は使わない
        token: vscode.CancellationToken // 今回は使わない
    ): Promise<void> {
        // 共通の関数を呼び出すだけ！
        await openLnkTargetPath(document.uri);
    }

    // CustomEditorProviderが持つべき必須メソッド（今回は使わないけど、空で定義が必要）
    async openCustomDocument(
        uri: vscode.Uri,
        context: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        return { uri, dispose: () => {} };
    }
    async saveCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Promise<void> {}
    async saveCustomDocumentAs(document: vscode.CustomDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {}
    async revertCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Promise<void> {}
    async backupCustomDocument(document: vscode.CustomDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
        return { id: '', delete: () => {} };
    }
}