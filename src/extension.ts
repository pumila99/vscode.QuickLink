// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import * as fs from 'fs/promises'; // fs/promisesモジュール

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "samplecode" is now active!');

	const disposable = vscode.commands.registerCommand('samplecode.helloWorld', async (uri: vscode.Uri) => {
		console.log('コマンドが実行されました！');

		if (!uri || uri.scheme !== 'file') {
			vscode.window.showWarningMessage('ファイルを選択してください。');
			return;
		}

		const filePath = uri.fsPath;

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

				// デバッグログは前回確認できたので、ここでは削除するね。
				// もし再度デバッグが必要になったら、また追加してね！

				if (targetPath) {
					try {
						const stats = await fs.stat(targetPath); // リンク先の情報を非同期で取得するよ！

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
							// ファイルでもディレクトリでもない場合（シンボリックリンクの破損など）
							vscode.window.showWarningMessage('リンク先がファイルでもディレクトリでもありません。');
						}
					} catch (statError: any) {
						console.error(`リンク先の情報取得エラー: ${statError.message}`);
						// ★ここを修正するよ！ENOENTエラーの場合に分かりやすいメッセージを出す！
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
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}