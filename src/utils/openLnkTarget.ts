// VS CodeのAPIは使わないけど、vscode.Uriとかのエラーメッセージに使うよ
import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import * as fs from 'fs/promises';

/**
 * 指定されたショートカット(.lnk)ファイルのリンク先を開く共通処理
 * @param uri ショートカットファイルのURI
 */
export async function openLnkTargetPath(uri: vscode.Uri): Promise<void> {
    const filePath = uri.fsPath;

    console.log('リンク先を開く処理が呼び出されました:', filePath);

    // .lnkファイルでなければ警告
    if (path.extname(filePath).toLowerCase() !== '.lnk') {
        vscode.window.showWarningMessage('選択されたファイルはWindowsショートカット (.lnk) ではありません。');
        return;
    }

    try {
        // PowerShellコマンドをBase64エンコードして実行
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
                    // リンク先がファイルかフォルダかを判別
                    const stats = await fs.stat(targetPath);

                    if (stats.isDirectory()) {
                        // フォルダの場合、startコマンドでエクスプローラーを開く
                        exec(`start "" "${targetPath}"`, (err) => {
                            if (err) {
                                console.error(`エクスプローラー起動エラー (ディレクトリ): ${err.message}`);
                                vscode.window.showErrorMessage(`ディレクトリを開けませんでした: ${err.message}`);
                            } else {
                                vscode.window.showInformationMessage(`ディレクトリを開きました: ${targetPath}`);
                            }
                        });
                    } else if (stats.isFile()) {
                        // ファイルの場合、explorer /selectで選択して開く
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