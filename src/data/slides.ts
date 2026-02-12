// スライドデータとCTAボタン情報
export interface CTAButton {
  text: string;
  position: 'bottom-center' | 'bottom-right' | 'bottom-left';
  action: 'scroll-next' | 'scroll-prev' | 'link' | 'horizontal-swipe';
  href?: string;
}

export interface Slide {
  id: string;
  image: string;
  cta?: CTAButton;
  // 横スワイプ分岐用のサブスライド
  horizontalSlides?: {
    id: string;
    image: string;
    cta?: CTAButton;
  }[];
}

export const slides: Slide[] = [
  {
    id: '01',
    image: '/images/01_ファーストビュー_作りっぱなしLP.png',
  },
  {
    id: '02',
    image: '/images/02_問題提起_制作会社は売れると約束しない.png',
  },
  {
    id: '03',
    image: '/images/03_問題提起_顧客離脱が見えない.png',
  },
  {
    id: '04',
    image: '/images/04a_コンセプト_育てる構造_植物.png',
    horizontalSlides: [
      {
        id: '04a',
        image: '/images/04a_コンセプト_育てる構造_植物.png',
      },
      {
        id: '04b',
        image: '/images/04b_コンセプト_育てる構造_階段.png',
      },
    ],
  },
  {
    id: '05',
    image: '/images/05a_従来LP限界_01普通のLPは限界.png',
    horizontalSlides: [
      {
        id: '05a',
        image: '/images/05a_従来LP限界_01普通のLPは限界.png',
      },
      {
        id: '05b',
        image: '/images/05b_従来LP限界_02スワイプで能動的.png',
      },
      {
        id: '05c',
        image: '/images/05c_従来LP限界_03ページ毎データ取得.png',
      },
    ],
  },
  {
    id: '06',
    image: '/images/06_サービス紹介_改善し続ける設計.png',
  },
  {
    id: '07',
    image: '/images/07_サービス紹介_1枚1枚に数字が宿る.png',
  },
  {
    id: '08',
    image: '/images/08a_メリット_01弱点を瞬時に理解.png',
    horizontalSlides: [
      {
        id: '08a',
        image: '/images/08a_メリット_01弱点を瞬時に理解.png',
      },
      {
        id: '08b',
        image: '/images/08b_メリット_02スピーディに改善.png',
      },
      {
        id: '08c',
        image: '/images/08c_メリット_03PDCA10倍速.png',
      },
    ],
  },
  {
    id: '09',
    image: '/images/09_運営サポート_お客様中心.png',
  },
  {
    id: '10',
    image: '/images/10_専門知識は一切不要.png',
  },
  {
    id: '11',
    image: '/images/11_ターゲット_安さ重視には不向き.png',
  },
  {
    id: '12',
    image: '/images/12_QA_成果は出ますか.png',
  },
  {
    id: '13',
    image: '/images/13_ビジョン_作り直しから育てるへ.png',
  },
  {
    id: '14',
    image: '/images/14_CTA_弱点を見つける体験.png',
  },
  {
    id: '15',
    image: '/images/15_CTA最終_個別相談LINE.png',
  },
];
