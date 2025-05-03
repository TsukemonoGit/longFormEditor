// types.d.ts
// ByteMDで使用する型定義を拡張

import type { Processor } from 'unified';

// RemarkプラグインでProcessorを返すようにする型定義
declare module 'bytemd' {
  export interface BytemdPlugin {
    // remarkプラグインがProcessorを返すように明示的に定義
    remark?: ((processor: Processor) => Processor) | undefined;
  }
  
  // ByteMD Editorのインターフェースを拡張
  export interface Editor {
    // テキスト挿入メソッド
    insert(text: string): void;
  }
}

// Nostrイベントのためのグローバル宣言
// NIP-07互換のブラウザ拡張用
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: any): Promise<any>;
      // その他のNIP-07メソッド
    };
  }
}