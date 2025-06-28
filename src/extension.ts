// VS CodeのAPI
import * as vscode from 'vscode';

// ★新しく作ったファイルから必要なものをインポートするよ！
import { openLnkTargetPath } from './utils/openLnkTarget';
import { LnkOpenerProvider } from './providers/LnkOpenerProvider';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext)
{
	console.log('Congratulations, your extension "samplecode" is now active!');

	// 右クリックメニューから呼ばれるコマンドを登録するよ！
	// コマンドが実行されたら、共通のopenLnkTargetPath関数を呼び出す
	context.subscriptions.push(
		vscode.commands.registerCommand('samplecode.helloWorld', openLnkTargetPath)
	);

	// カスタムエディタプロバイダを登録するよ！
	// カスタムエディタでファイルが開かれたら、LnkOpenerProviderが呼び出される
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			'samplecode.lnkOpener', // package.jsonで定義したviewTypeと一致させる
			new LnkOpenerProvider()
		)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}