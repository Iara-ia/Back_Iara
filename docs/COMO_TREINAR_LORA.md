# Como treinar o LoRA da persona (face-lock) e plugar na IARA

O **LoRA** é o "modelo do rosto" da persona: um arquivo leve treinado nas fotos de
referência que, junto do Flux, faz a geração sair **com o rosto dela** de forma
consistente. Sem LoRA, o gerador usa um rosto genérico (e no dev, um placeholder).

> ⚠️ **Consentimento é obrigatório.** Só treine um LoRA com fotos de uma pessoa que
> **autorizou por escrito** o uso da imagem para a influencer (direito de imagem / LGPD).
> As fotos de referência ficam só em `.storage/personas/<persona>/` (gitignored) — **nunca
> versione nem suba fotos pessoais para repositório público.**

---

## 1. As fotos de referência

- Use **8–15 fotos solo** da pessoa (uma pessoa por foto — nada de terceiros).
- Variadas: ângulos, expressões, luz; rosto nítido e bem iluminado.
- Já estão em `repos/Back_Iara/.storage/personas/isabella/01..NN.jpg` (as aprovadas no painel).
- Boas refs = bom LoRA. Evite fotos borradas, muito escuras ou com o rosto pequeno/coberto.

## 2. Treinar (escolha um caminho)

### A) Replicate — mais fácil (recomendado)
1. Crie conta em https://replicate.com e pegue o `REPLICATE_API_TOKEN`.
2. Junte as fotos num `.zip` (`isabella_refs.zip`).
3. Rode o treinador de LoRA do Flux (ex.: `ostris/flux-dev-lora-trainer`):
   - `input_images`: o zip
   - `trigger_word`: uma palavra única, ex. `isabellasouza`
   - `steps`: ~1000 (ajuste por qualidade/custo)
4. Saída = um arquivo de **pesos** (`.safetensors`) com uma **URL**. Essa URL (ou o id do
   destino) é o seu **`loraId`**. Custo típico: ~US$ 2–5, ~20–30 min.

### B) fal.ai — rápido
- https://fal.ai → `flux-lora-fast-training`. Mesmos insumos (zip + trigger word).
- Devolve a URL dos pesos = `loraId`.

### C) Local (GPU) — controle total
- `ai-toolkit` (ostris) ou `kohya_ss`. Precisa de GPU (≥12–16 GB VRAM).
- Gera o `.safetensors` localmente; hospede num storage acessível e use a URL como `loraId`.

## 3. Plugar na IARA

1. **Painel → Persona →** campo **"Modelo facial — LoRA"**: cole o `loraId` (id/URL) e
   **Salvar persona**. O selo muda para *"✓ rosto travado"*.
2. **`repos/Back_Iara/.env`:**
   ```
   PROVIDER_IMAGE=flux
   REPLICATE_API_TOKEN=...        # ou FAL_KEY=... conforme o provedor
   FLUX_MODEL=black-forest-labs/flux-dev   # ajuste ao seu setup
   ```
3. Reinicie o back (`npm run dev`). Pronto.

A partir daí, a geração já usa o LoRA automaticamente: o pipeline lê
`persona.visualProfile.loraId` e passa para o provider de imagem
(`src/services/contentPipeline.ts` → `providers.image.generate({ ..., loraId })`).

## 4. Implementar a chamada real do Flux (uma vez)

O hook já existe em `src/providers/image/index.ts` (`FluxImageProvider`, marcado com
`// PLUGAR AQUI`). Implemente a chamada ao provedor escolhido usando `params.prompt`,
`params.loraId` e a **trigger word** no prompt (ex.: prefixe a legenda visual com
`isabellasouza, ...`). Mantenha a mesma interface (`generate` → `{ url, width, height }`)
para o resto do sistema não mudar. Os MOCKs continuam valendo quando `PROVIDER_IMAGE`
não é `flux`.

## 5. Qualidade & boas práticas

- **Trigger word** consistente entre treino e prompts.
- Retreine se mudar muito o visual (corte/cor de cabelo) — ou treine "eras" (um LoRA por look).
- Gere em lote e cure na **Fila de Aprovação** (humano no loop) antes de publicar.
- Custo de imagem entra no teto diário (guardrail de gasto já existe no pipeline).
