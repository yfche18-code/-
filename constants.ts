
import { ArtStyle } from './types';

export const ART_STYLES: ArtStyle[] = [
  {
    id: 'random',
    name: '随机',
    description: '每次生成都是一次艺术开箱',
    previewImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200&h=200&auto=format&fit=crop', // 抽象几何图作为占位
    prompt: 'RANDOM' // 逻辑标记
  },
  {
    id: '01',
    name: '黑白电影感',
    description: '戏剧性低调光影，雕刻五官轮廓',
    previewImage: 'https://picsum.photos/seed/style1/400/500',
    prompt: 'black and white studio portrait, dramatic low key lighting, strong single side key light, deep shadows sculpting facial structure, cinematic contrast, editorial photography style, realistic skin texture with visible pores, minimal makeup, sharp details, dark plain background, moody atmosphere, professional RAW photo, ultra realistic'
  },
  {
    id: '02',
    name: '柔光暖色肖像',
    description: '商业高调柔光，自然且精致的面容',
    previewImage: 'https://picsum.photos/seed/style2/400/500',
    prompt: 'soft warm color portrait, high key studio lighting with diffused soft light, creamy skin tones, natural yet polished makeup, smooth but realistic skin texture, luxury commercial photography style, clean bright background, elegant and approachable mood, professional studio photo, high detail'
  },
  {
    id: '03',
    name: '冷色未来感',
    description: '青蓝调边缘光，科幻时尚大片',
    previewImage: 'https://picsum.photos/seed/style3/400/500',
    prompt: 'cool tone portrait, cinematic blue and cyan lighting, strong rim light outlining silhouette, futuristic fashion photography style, glossy highlights on skin, minimal modern makeup, dark gradient background, high contrast, ultra sharp focus, sci fi mood, professional studio photo'
  },
  {
    id: '04',
    name: '复古油画光影',
    description: '伦勃朗式光影，艺术馆级质感',
    previewImage: 'https://picsum.photos/seed/style4/400/500',
    prompt: 'warm cinematic portrait, Rembrandt lighting with soft shadow transitions, golden amber tones, painterly light and shadow, fine art photography style, natural skin texture, vintage inspired makeup, dark brown background, emotional and artistic mood, museum quality portrait'
  },
  {
    id: '05',
    name: '高对比时尚',
    description: '红蓝大胆撞色，杂志封面风',
    previewImage: 'https://picsum.photos/seed/style5/400/500',
    prompt: 'high fashion portrait, bold red and blue color lighting, strong directional studio lights, high contrast shadows, editorial magazine cover photography, sharp and clean makeup look, confident expression, dark studio background, modern and striking aesthetic, ultra high detail'
  }
];

// 后台随机风格池
export const HIDDEN_RANDOM_PROMPTS = [
  'ethereal soft light studio portrait, glowing skin, dreamy atmosphere, professional corporate attire, soft focus background, elegant white color palette, high detail, luxury feel',
  'minimalist nordic style portrait, sharp focus, clean lines, professional charcoal suit, stark white studio background, neutral lighting, high fashion editorial, crisp details',
  'golden hour studio lighting portrait, warm amber highlights, professional corporate dress, sunset vibe but in a professional studio setting, highly detailed skin texture, professional RAW photo',
  'dramatic aurora cold lighting, professional creative industry portrait, bold emerald and violet accents on a business suit, dark charcoal background, sharp focus, cinematic high-end look',
  'technicolor pop art portrait, vibrant studio gels, professional designer outfit, clean bold highlights, fashion magazine aesthetic, sharp eyes, high fashion photography'
];
