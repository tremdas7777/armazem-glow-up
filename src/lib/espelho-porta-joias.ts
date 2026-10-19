import type { Produto } from "@/lib/catalog";

/** Espelho Porta Joias — copy e mídia da Lojas Miller (espelho-porta-joias-giratorio). */
export const MIRROR_ID = "espelho-porta-joias-giratorio";

const CORES = [
  { nome: "Branco", imagem: 0 },
  { nome: "Cinza", imagem: 1 },
  { nome: "Preto", imagem: 2 },
  { nome: "Pinhão", imagem: 3 },
] as const;

export const ESPELHOPORTA_JOIAS: Produto = {
  id: MIRROR_ID,
  ref: "EPJ-360",
  nome: "Espelho Porta Joias 360° com Organizador Interno",
  marca: "Armário Feminino",
  categoria: "espelhos",
  // Mesmos preços da Miller (R$ 134,90 · de R$ 329,90). Sem desconto geral em cima.
  preco: 134.9,
  precoAntigo: 329.9,
  imagens: ['https://cdn.shopify.com/s/files/1/1008/4774/7357/files/1.jpg?v=1787949224', 'https://cdn.shopify.com/s/files/1/1008/4774/7357/files/Gemini_Generated_Image_ndza18ndza18ndza.png?v=1787949227', 'https://cdn.shopify.com/s/files/1/1008/4774/7357/files/Gemini_Generated_Image_hw3r40hw3r40hw3r.png?v=1787949225', 'https://cdn.shopify.com/s/files/1/1008/4774/7357/files/Gemini_Generated_Image_26by6t26by6t26by.png?v=1787949226', 'https://cdn.shopify.com/s/files/1/1008/4774/7357/files/5.png?v=1787949224', 'https://cdn.shopify.com/s/files/1/1008/4774/7357/files/6_8b1d84dc-9363-40ed-b42b-e6de2e749586.png?v=1787949224', 'https://cdn.shopify.com/s/files/1/1008/4774/7357/files/4.jpg?v=1787949224', 'https://cdn.shopify.com/s/files/1/1008/4774/7357/files/7.png?v=1787949224', 'https://cdn.shopify.com/s/files/1/1008/4774/7357/files/3.png?v=1787949224', 'https://cdn.shopify.com/s/files/1/1008/4774/7357/files/2.png?v=1787949225'],
  cores: [...CORES],
  tamanhos: [],
  novo: true,
  maisVendido: true,
  descricao: `Seu Camarim Particular em 360 Graus

Espelho de corpo inteiro, organizador de joias e estação de maquiagem. Tudo o que você precisa em um giro.

O Espelho Porta-Joias Giratório redefine a organização do seu quarto. Com um design sofisticado sem moldura (frameless) e acabamento branco impecável, ele gira 360° para oferecer acesso instantâneo aos seus acessórios de um lado e um espelho deslumbrante do outro. O interior forrado em veludo preto protege suas joias, enquanto os LEDs automáticos garantem que você brilhe em qualquer hora do dia.

💃 Espelho Sem Moldura

Um espelho amplo de 37 x 155 cm que oferece uma visão completa da cabeça aos pés. O design sem bordas amplia o ambiente e facilita a conferência do look diário.

💡 6 LEDs Automáticos

Ao abrir a porta, 6 luzes LED acendem automaticamente, iluminando suas joias com clareza. Escolha seus acessórios perfeitos mesmo no escuro, sem incomodar ninguém.

💄 Mini "Vanity" Interna

Conta com um espelho interno extra e uma prateleira dobrável, criando uma bancada instantânea para maquiar-se e colocar brincos sem precisar fechar o armário.

Capacidade para Toda a Sua Coleção

Chega de colares embolados ou brincos perdidos. Cada item tem seu lugar.

• 💍 91 Slots para Anéis

• 👂 120 Slots para Brincos

• ✨ 54 Furos para Tarraxas

• 📿 18 Ganchos para Colares

• 🖐️ 3 Hastes para Pulseiras

• 📦 2 Gavetas Inferiores

• 📚 4 Prateleiras para Cosméticos

• 👜 1 Bolsa para Maquiagem

📋 Especificações Técnicas

•
Dimensões Totais: 162 cm (Altura) x 54,5 cm (Diâmetro da Base)

•
Tamanho do Espelho: 155 cm x 37 cm

•
Material: Madeira Engenheirada (MDF) de alta qualidade

•
Cor: Externo Branco + Forro Interno em Veludo Preto

•
Rotação: Base giratória 360°

•
Segurança: Porta com fechadura e chaves (2 inclusas)

•
Montagem: Estrutura "Free-Standing" (de chão), estável e segura.

Dúvidas Frequentes

🔒 O armário possui tranca?

Sim! Para sua tranquilidade, o armário é "Lockable" (trancável) e acompanha chaves, mantendo suas joias valiosas longe do alcance de crianças ou curiosos.

🔋 Como funcionam os LEDs?

As 6 luzes LED são alimentadas por pilhas (não inclusas para segurança no transporte) e possuem acionamento automático ao abrir a porta, dispensando fios ligados na tomada.

🏗️ Ele é estável ao girar?

Sim. A base redonda de 54,5 cm de diâmetro foi projetada para oferecer estabilidade total, permitindo que você gire o espelho suavemente sem balançar a estrutura.

Organize-se com Elegância.

Transforme sua rotina de beleza com o Porta-Joias Giratório.`,
};

// Contrato da sacola: cor viaja junto do "tamanho" (aqui só Único).
ESPELHOPORTA_JOIAS.tamanhos = CORES.map((c) => `Único · ${c.nome}`);
