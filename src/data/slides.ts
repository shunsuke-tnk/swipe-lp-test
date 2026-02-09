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
    image: '/images/01.Gemini_Generated_Image_am2oo5am2oo5am2o.png',
    // CTAなし
  },
  {
    id: '02',
    image: '/images/02.Gemini_Generated_Image_idylfpidylfpidyl.png',
    cta: {
      text: '理由を知る',
      position: 'bottom-center',
      action: 'scroll-next',
    },
  },
  {
    id: '03',
    image: '/images/03.Gemini_Generated_Image_2ok8ea2ok8ea2ok8.png',
    cta: {
      text: '具体的な解決策を見る',
      position: 'bottom-center',
      action: 'scroll-next',
    },
  },
  {
    id: '04',
    image: '/images/04.Gemini_Generated_Image_fov4lufov4lufov4.png',
    horizontalSlides: [
      {
        id: '04-1',
        image: '/images/04-1.Gemini_Generated_Image_3jd0qf3jd0qf3jd0.png',
        cta: {
          text: 'スワイプで次へ →',
          position: 'bottom-right',
          action: 'horizontal-swipe',
        },
      },
      {
        id: '04-2',
        image: '/images/04-2.Gemini_Generated_Image_2z68hf2z68hf2z68.png',
        cta: {
          text: 'スワイプで次へ →',
          position: 'bottom-right',
          action: 'horizontal-swipe',
        },
      },
      {
        id: '04-3',
        image: '/images/04-3.Gemini_Generated_Image_hpflvihpflvihpfl.png',
        cta: {
          text: 'スワイプで次へ →',
          position: 'bottom-right',
          action: 'horizontal-swipe',
        },
      },
    ],
  },
  {
    id: '05',
    image: '/images/05.Gemini_Generated_Image_kd69jykd69jykd69.png',
    // CTAなし
  },
  {
    id: '06',
    image: '/images/06.Gemini_Generated_Image_1w09qk1w09qk1w09.png',
    cta: {
      text: '運用の実例を見る',
      position: 'bottom-center',
      action: 'horizontal-swipe',
    },
    horizontalSlides: [
      {
        id: '06-1',
        image: '/images/06-1.Gemini_Generated_Image_yw1nk5yw1nk5yw1n.png',
        cta: {
          text: '← 前に戻る',
          position: 'bottom-left',
          action: 'scroll-prev',
        },
      },
      {
        id: '06-2',
        image: '/images/06-2.Gemini_Generated_Image_iseag4iseag4isea.png',
        cta: {
          text: '← 前に戻る',
          position: 'bottom-left',
          action: 'scroll-prev',
        },
      },
      {
        id: '06-3',
        image: '/images/06-3.Gemini_Generated_Image_nmpi45nmpi45nmpi.png',
        cta: {
          text: '← 前に戻る',
          position: 'bottom-left',
          action: 'scroll-prev',
        },
      },
    ],
  },
  {
    id: '07',
    image: '/images/07.Gemini_Generated_Image_kxnaixkxnaixkxna.png',
    cta: {
      text: 'メリットを確認',
      position: 'bottom-center',
      action: 'scroll-next',
    },
  },
  {
    id: '08',
    image: '/images/08.Gemini_Generated_Image_a3323va3323va332.png',
    cta: {
      text: 'メリットを確認',
      position: 'bottom-center',
      action: 'scroll-next',
    },
  },
  {
    id: '09',
    image: '/images/09.Gemini_Generated_Image_pdrog0pdrog0pdro.png',
    cta: {
      text: '疑問を解消する',
      position: 'bottom-center',
      action: 'scroll-next',
    },
  },
  {
    id: '10',
    image: '/images/10.Gemini_Generated_Image_dfmi7cdfmi7cdfmi.png',
    cta: {
      text: '期待できる未来を見る',
      position: 'bottom-center',
      action: 'scroll-next',
    },
  },
  {
    id: '11',
    image: '/images/11.Gemini_Generated_Image_pofzatpofzatpofz.png',
    cta: {
      text: '体験してください',
      position: 'bottom-center',
      action: 'scroll-next',
    },
  },
  {
    id: '12',
    image: '/images/12.Gemini_Generated_Image_ga0hi0ga0hi0ga0h.png',
    cta: {
      text: 'スワイプLP導入相談 →',
      position: 'bottom-center',
      action: 'link',
      href: '#contact',
    },
  },
  {
    id: '13',
    image: '/images/13.Gemini_Generated_Image_1nax9v1nax9v1nax.png',
    cta: {
      text: '公式LINEで資料を受け取る →',
      position: 'bottom-center',
      action: 'link',
      href: 'https://line.me/',
    },
  },
];
