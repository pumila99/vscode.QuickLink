// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import * as fs from 'fs/promises';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "samplecode" is now active!');

	// ★右クリックメニューから呼ばれるコマンドを登録するよ！
	// コマンドが実行されたら、共通のopenLnkTargetPath関数を呼び出す
	context.subscriptions.push(
		vscode.commands.registerCommand('samplecode.helloWorld', openLnkTargetPath)
	);

	// ★カスタムエディタプロバイダを登録するよ！
	// カスタムエディタでファイルが開かれたら、LnkOpenerProviderが呼び出される
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			'samplecode.lnkOpener', // package.jsonで定義したviewTypeと一致させる
			new LnkOpenerProvider()
		)
	);
}

// ★リンク先を開く共通の処理を関数として定義するよ！
async function openLnkTargetPath(uri: vscode.Uri): Promise<void> {
    const filePath = uri.fsPath;

    console.log('リンク先を開く処理が呼び出されました:', filePath);

    if (path.extname(filePath).toLowerCase() !== '.lnk') {
        vscode.window.showWarningMessage('選択されたファイルはWindowsショートカット (.lnk) ではありません。');
        return;
    }

    try {
        const psScriptContent = `(New-Object -ComObject WScript.Shell).CreateShortcut('${filePath.replace(/'/g, "''")}').TargetPath`;
        const encodedCommand = Buffer.from(psScriptContent, 'utf16le').toString('base64');

        exec(`powershell.exe -EncodedCommand ${encodedCommand}`, async (error, stdout, stderr) => {
            if (error) {
                console.error(`ショートカットのリンク先取得エラー: ${error.message}`);
                vscode.window.showErrorMessage(`ショートカットのリンク先を開けませんでした: ${error.message}`);
                return;
            }
            if (stderr) {
                console.warn(`ショートカットのリンク先取得警告: ${stderr}`);
            }

            const targetPath = stdout.trim();

            if (targetPath) {
                try {
                    const stats = await fs.stat(targetPath);

                    if (stats.isDirectory()) {
                        exec(`start "" "${targetPath}"`, (err) => {
                            if (err) {
                                console.error(`エクスプローラー起動エラー (ディレクトリ): ${err.message}`);
                                vscode.window.showErrorMessage(`ディレクトリを開けませんでした: ${err.message}`);
                            } else {
                                vscode.window.showInformationMessage(`ディレクトリを開きました: ${targetPath}`);
                            }
                        });
                    } else if (stats.isFile()) {
                        exec(`explorer /select,"${targetPath}"`, (err) => {
                            if (err) {
                                console.error(`エクスプローラー起動エラー (ファイル): ${err.message}`);
                                vscode.window.showErrorMessage(`ファイルを選択できませんでした: ${err.message}`);
                            } else {
                                vscode.window.showInformationMessage(`ファイルを選択しました: ${targetPath}`);
                            }
                        });
                    } else {
                        vscode.window.showWarningMessage('リンク先がファイルでもディレクトリでもありません。');
                    }
                } catch (statError: any) {
                    console.error(`リンク先の情報取得エラー: ${statError.message}`);
                    if (statError.code === 'ENOENT') {
                        vscode.window.showErrorMessage(`エラー：リンク先のファイルまたはフォルダが見つかりませんでした。パス: ${targetPath}`);
                    } else {
                        vscode.window.showErrorMessage(`リンク先の情報を取得できませんでした: ${statError.message}`);
                    }
                }
            } else {
                vscode.window.showWarningMessage('ショートカットのリンク先が見つかりませんでした。');
            }
        });

    } catch (error: any) {
        console.error(`不明なエラー: ${error.message}`);
        vscode.window.showErrorMessage(`不明なエラーが発生しました: ${error.message}`);
    }
}


// カスタムエディタのプロバイダクラス
class LnkOpenerProvider implements vscode.CustomEditorProvider {

    // ファイルが開かれたときに呼び出される
    public async resolveCustomEditor(
        document: vscode.CustomDocument, // 開かれたファイルの情報
        webviewPanel: vscode.WebviewPanel, // Webviewパネル（今回は使わないけど必要）
        token: vscode.CancellationToken // キャンセルトークン（今回は使わないけど必要）
    ): Promise<void> {
        // ここで共通の関数を呼び出すだけ！
        await openLnkTargetPath(document.uri);
    }

    // CustomEditorProviderが持つべき必須メソッド（今回は使わないけど、空で定義が必要）
    public async openCustomDocument(
        uri: vscode.Uri,
        context: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        return { uri, dispose: () => {} };
    }
    public async saveCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Promise<void> {}
    public async saveCustomDocumentAs(document: vscode.CustomDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {}
    public async revertCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Promise<void> {}
    public async backupCustomDocument(document: vscode.CustomDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
        return { id: '', delete: () => {} };
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}