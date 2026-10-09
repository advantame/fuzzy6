# LLM explainer deck fact-check — research log

## Question, scope, and start

- Question: Fact-check every supplied claim H1–H7, C1–C7, T1–T3, A1–A7 for a Japanese explainer deck (history → concepts → chatbots → agents). Check dates, quantities, institutional attribution, exact quotations, and current figures. Final report must contain one row per item ID, status (confirmed / corrected / uncertain), corrected value or wording, source URLs, and short notes.
- Scope: Evidence research only. No deck, engine, or other project edits. Exactly two eventual artifacts in `research/llm-facts`: this append-only log and final `report.md`. Report is reserved for the attendant-designated report turn.
- UTC start: 2026-10-09 16:53:01 UTC (clock tool). Environment date says 2026-10-10; use actual retrieval date from clock, and explicitly distinguish the research cutoff from source publication dates.
- Sources: Prefer original papers and official announcements/docs/code; court records for litigation; reputable reporting for third-party estimates. Exact typography requires facsimile inspection where available; distinguish layout line breaks from text. Current/GA claims require dated availability evidence, not model context claims alone.
- Local instructions read: `AGENTS.md`, `docs/spec.md` (retrieved 2026-10-09). No execution, installation, or project modification is needed.

## Initial plan

Each unit crosses an evidence question with a source group; coverage may be revised as evidence warrants.

1. H1–H3: Are historical quotations, labels, mechanisms and anecdotes exact? Original Shannon, Turing and Weizenbaum papers/facsimiles plus Weizenbaum firsthand retrospective.
2. H4–H5, C2–C3: Are Transformer/GPT origins, architecture and illustrative examples exact? Original Transformer, GPT, GPT-2, GPT-3 and word2vec papers/official repositories.
3. H6–H7: Which precise announcement/publication/release dates and adoption estimates belong on the timeline? Original announcements, paper metadata, Dartmouth proposal, Reuters/UBS reporting.
4. C1, C4–C5, C7: Are tokenizer sizes, training quantities and scaling claims accurate? Official tokenizer code, Meta announcement, Chinchilla and Kaplan papers.
5. C6: What context windows were offered at each historical date, and what is the largest generally available window at the research cutoff? Provider announcements and current availability/model documentation; define GA and search competing providers.
6. T1–T2: What were RLHF findings, dates, API roles and statelessness contracts? InstructGPT paper, official OpenAI and Anthropic API docs/announcements.
7. T3: What precisely did Mata v. Avianca sanctions cover? Court opinion/order and corroborating reputable coverage as needed.
8. A1–A4: Which tool/agent protocols, benchmark counts and ecosystem dates are correct? Official announcements, Toolformer/ReAct/SWE-bench papers, benchmark and MCP docs.
9. A5: Which METR horizon values and doubling-time estimates are supported, in which dated evaluation versions? Original paper, official data/code, updates through research cutoff. Keep estimates, uncertainty intervals and methodology versions distinct.
10. A6–A7: What do the multi-agent results and computer-use launch claims actually say? Anthropic/OpenAI original announcements and engineering report.
11. Cross-check unresolved points and coverage: reconcile publication vs release dates, exact quote diffs, current figures, and all 24 item IDs against the original request; close or explicitly record uncertainty.
12. Report phase (separate attendant-designated turn): reread the durable log and write `report.md`, with 24 table rows plus uncertainties, plan evolution and recommendations.

Remaining research units: 1–11. Unit 12 is report-only and starts only after the ready-to-report boundary.

## Plan revision 1

Original-paper facsimiles and modern transcriptions can disagree even when the familiar quotation is widely reproduced. H1 exposed a substantive letter change plus added punctuation; H2 exposed typography normalization. Derived question: which edition does an on-screen “exact original” quote represent? **Pursue now**, because it is essential to the requested character-level verification. Unit 1 therefore distinguishes original print, corrected reprint, OCR, and normalized display transcription. No new broad historical investigation is needed. Remaining units: finish 1; then 2–11 as planned; 12 remains the separate report phase.

## Unit 1: H1–H3 — original historical quotations, labels, and ELIZA anecdote

Completed: 2026-10-09 UTC. Retrieval date for every URL below: 2026-10-09. This unit is complete; later final coverage review may improve typography presentation but the evidence and edition distinction are established.

### Sources consulted and quality

- **S1a** Shannon, original July 1948 BSTJ facsimile (University of Notre Dame mirror), especially printed p. 388 / PDF page 6: https://www3.nd.edu/~powers/ame.20231/shannon1948a.pdf . Visually inspected the original scanned page, not merely OCR.
- **S1b** Shannon, a reset PDF explicitly headed “Reprinted with corrections,” p. 7, §3 (Harvard mirror): https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf . Read complete example text and front-page bibliographic statement. This is NOT the original journal typography.
- **S1c** Publisher bibliographic record: https://onlinelibrary.wiley.com/doi/abs/10.1002/j.1538-7305.1948.tb01338.x . July 1948, vol. 27(3), pp. 379–423. Search-result metadata consulted; use S1a/S1b as read source evidence. Full two-part citation in S1b: vol. 27, pp. 379–423 and 623–656, July and October 1948.
- **S2a** Turing original offprint archive record and scan, King's College Cambridge, AMT/B/19: https://turingarchive.kings.cam.ac.uk/publications-lectures-and-talks-amtb/amt-b-19 . Original p. 433 visually inspected. Embedded PDF URL obtained from the record: https://mediadepot.kings.cam.ac.uk/getmedia/81/be4a3d910d5d58e3911315113c60a09f6293fa896a5e3795998fa6b4fb72b71446336e3c7c92d5e08fd0fb2762b6f663279ba799d7fd562480b4bf63c63e02b9 . Prefer the stable archive record in final citations.
- **S2b** Oxford publisher metadata and opening snippet: https://academic.oup.com/mind/article/LIX/236/433/986238 . Search surfaced volume LIX(236), October 1950, pp. 433–460, publication 1 October 1950, DOI https://doi.org/10.1093/mind/LIX.236.433 . Page/PDF open failed in web tool; do not claim full text was read there.
- **S2c** Turing modern transcription, University of Maryland Baltimore County mirror: https://www.csee.umbc.edu/courses/471/papers/turing.pdf . Read §1 on written/typewritten answers, teleprinter, intermediary, original game and machine substitution. WARNING: its header incorrectly says “Mind 49” and it normalizes/changes quote marks, so not authoritative for bibliography or exact typography.
- **S2d** Andrew Hodges, bibliography and explanation of original-vs-reset editions: https://www.turing.org.uk/sources/biblio1.html . Followed to the original archive; background on known modern designation also corroborated by reputable historical account https://time.com/3596955/the-price-of-genius/ (search result consulted).
- **S3a** Weizenbaum 1966 original CACM facsimile, Stanford mirror: https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf . Read p. 36 abstract and p. 37 mechanism; visually inspected p. 36 conversation and January 1966 / volume 9 / number 1 imprint. OCR is severely garbled; use the visual reading for quotations.
- **S3b** Weizenbaum, *Computer Power and Human Reason: From Judgment to Calculation* (1976), introduction reprinted in *The New Media Reader*, pp. 369–371 of anthology, particularly pp. 369–370: https://cyborgdigitalculture.files.wordpress.com/2013/09/24-weizenbaum-03.pdf . This is a firsthand source for “parody,” Rogerian therapist, DOCTOR naming, anthropomorphism and secretary anecdote. Original book location for anecdote is pp. 6–7, corroborated by S3c.
- **S3c** Peer-reviewed historical study with original page references: https://link.springer.com/article/10.1007/s00146-026-03086-7 (search result consulted). Cites Weizenbaum 1976 pp. 6–7 and warns that identities of the secretary and the sample-conversation participant are separate historical questions.
- A six-page book scan https://reneberger.hommereseau.ch/pdf/weizenbaum.pdf was opened but contains title, copyright and preface only, NOT the anecdote. Do not cite it as evidence for the secretary story.

### H1 findings — status: corrected (edition-sensitive)

Bibliography and §3 subject are confirmed. All five user-supplied strings match **S1b, the corrected/reset reprint**, after joining lines and removing layout hyphens. However, they do **not** all match the **1948 original** S1a. Original zero-order example has `FFJEYVKCQSGXYD`, whereas the user's/reprint's form is `FFJEYVKCQSGHYD` (X versus H). None of the five requested samples has a terminal period on original p. 388. The unrequested first-order **word** sample does have a period; do not generalize the punctuation finding to all six examples.

Exact original sample content below, with layout line breaks joined to single spaces; no enclosing quotation marks and no added terminal punctuation:

1. **Zero-order approximation**:
   `XFOML RXKHRJFFJUJ ZLPWCFWKCYJ FFJEYVKCQSGXYD QPAAMKBZAACIBZLHJQD`
2. **First-order approximation**:
   `OCRO HLI RGWR NMIELWIS EU LL NBNESEBYA TH EEI ALHENHTTPA OOBTTVA NAH BRL`
3. **Second-order approximation**:
   `ON IE ANTSOUTINYS ARE T INCTORE ST BE S DEAMY ACHIN D ILONASIVE TUCOOWE AT TEASONARE FUSO TIZIN ANDY TOBE SEACE CTISBE`
4. **Third-order approximation**:
   `IN NO IST LAT WHEY CRATICT FROURE BIRS GROCID PONDENOME OF DEMONSTURES OF THE REPTAGIN IS REGOACTIONA OF CRE`
5. **Second-Order Word Approximation** (example number 6 in the paper):
   `THE HEAD AND IN FRONTAL ATTACK ON AN ENGLISH WRITER THAT THE CHARACTER OF THIS POINT IS THEREFORE ANOTHER METHOD FOR THE LETTERS THAT THE TIME OF WHO EVER TOLD THE PROBLEM FOR AN UNEXPECTED`

Original printed labels: zero-order says symbols independent and **equi-probable**; first-order says symbols independent but with frequencies of English text; second/third specify digram/trigram structure as in English. Second-order word approximation uses word transition probabilities and no further structure. There are 27 symbols, including a space. The user’s shorthand conceptual labels are accurate, but “letter frequencies” should not imply that spaces were excluded.

Recommendation: use the original strings above when labeling the exhibit “1948 original.” If retaining the supplied strings, explicitly cite the corrected reprint. Do not silently present reprint typography as a facsimile transcription. Reason for X→H change is not established; call it an edition difference, not a proven erratum or OCR correction.

### H2 findings — status: corrected for strict typography; historical substance confirmed

S2a gives Mind, LIX [59], no. 236, October 1950; original article pp. 433–460. The opening wording is the requested wording. Original print has single curved quotation marks, no full stop after the closing quote, and **I PROPOSE** in initial/small capitals. It visibly includes typographic spaces around the quoted question and before the question mark. A diplomatic plain-text representation (small caps represented with capitals) is:

`I PROPOSE to consider the question, ‘ Can machines think ? ’`

For normal on-screen quotation with print spacing and small caps normalized, use:

`I propose to consider the question, ‘Can machines think?’`

The normalized text agrees with the Oxford publisher's abstract. State the normalization: a printed page has glyphs/spacing, not literal Unicode code points; do not claim byte-for-byte identity. The user's straight single quotes represent the same punctuation convention but are not the original glyph style. Do not put an extra period after the closing single quote.

S2a §1 introduces a man/woman identification game; S2c §1 then asks what happens when a machine replaces player A. Answers should be written or preferably typed; a teleprinter is ideal, and an intermediary is also possible. Thus “文字によるやり取りを通じて判定する模倣ゲームを提案。のちにチューリング・テストとして知られる” is defensible. Do not claim he named it “Turing test” or that the 1950 text immediately begins with the simplified modern human-versus-AI setup.

### H3 findings — status: confirmed, with typography and attribution notes

S3a confirms Joseph Weizenbaum at MIT, *Communications of the ACM* 9(1), January 1966, pp. 36–45. Title word order is the supplied title. The mechanism is keyword-triggered decomposition and reassembly rules, with fallback/memory behavior; ELIZA is the general program and DOCTOR a script, not identical names for all possible ELIZA behavior. S3b explicitly calls the first experiment a parody of a Rogerian psychotherapist in an initial interview.

All eight user-supplied conversation lines match the original p. 36 in wording, capitalization, and sentence punctuation. Original machine lines have no question marks or periods. Typeset apostrophes may be rendered as U+2019; ASCII apostrophes are a display normalization. Exact text in normalized typographic transcription:

```text
Men are all alike.
IN WHAT WAY
They’re always bugging us about something or other.
CAN YOU THINK OF A SPECIFIC EXAMPLE
Well, my boyfriend made me come here.
YOUR BOYFRIEND MADE YOU COME HERE
He says I’m depressed much of the time.
I AM SORRY TO HEAR YOU ARE DEPRESSED
```

S3b records Weizenbaum's surprise at people's emotional involvement and anthropomorphism. His secretary knew the program's development yet asked him to leave after a few exchanges. Attribute this as **Weizenbaum's retrospective report**, in *Computer Power and Human Reason* (1976), pp. 6–7, rather than saying the anecdote appears in the 1966 paper or proves literal understanding. A short usable source excerpt is: “After only a few interchanges with it, she asked me to leave the room.” No need to identify the secretary, equate her with the sample-dialogue participant, or infer that all users were deceived.

### Method, unresolved points, and next unit

- Web PDF screenshots returned only reference text through the tool interface, so they were not used as visual evidence. Original Shannon, Turing and ELIZA pages were instead fetched into bounded memory and rendered with installed `pdftoppm`, piped in memory to images. No downloaded PDFs/images or scripts were written; only this log exists so far. Fetch size caps 10 MB (Shannon/ELIZA), 30 MB (Turing); one-page render limits and subprocess timeouts. All processes completed.
- Remaining uncertainty is limited to the editorial reason for the Shannon variant and exact encoding of historical typographic spacing, neither of which changes the substantive historical conclusions. Report must retain edition/normalization notes.
- The OpenAI Docs skill at `/home/apm/.codex/skills/.system/openai-docs/SKILL.md` was read for future OpenAI units but not applied to this non-OpenAI unit. When those units start, announce its use and consult official sources. The user's explicit request for original historical announcements/papers takes precedence over the skill's narrower documentation-domain restriction; include openai.com historical announcements as needed.
- Next unit: **Unit 2**, original Transformer, GPT-series and word2vec papers/repositories (H4–H5, C2–C3).
- Remaining research units: 2–11. No report has been drafted. Attendant requested checkpoint at token threshold; the completed unit is now durable, so checkpoint can occur before continuing.

## Plan revision 2

Unit 2 surfaced two attribution/counting distinctions needed for the original claims: (a) the original GPT paper does not state a total parameter count, so its released parameter-shape metadata supplies a reproducible check; (b) the word2vec paper attributes the famous analogy to another Mikolov et al. paper on RNN-derived embeddings. These derived questions are **pursued now within Unit 2**, rather than expanding into a general embedding history. The GPT-3 few-shot example is embedded as a figure and missing from PDF text extraction, so visual verification remains necessary. No units are added or dropped. Remaining units after Unit 2: 3–11; report phase stays separate.

## Unit 2: H4–H5, C2–C3 — Transformer, GPT origins and architecture, word-vector analogy

Completed: 2026-10-09 UTC. All sources below retrieved 2026-10-09. Unit complete; no report drafted. OpenAI Docs skill applied and announced. Its direct official documentation search returned current API material rather than the historical paper; the requested original papers and announcements were therefore used, consistent with the user's explicit source preference.

### Sources consulted

- **S4a** Vaswani et al., *Attention Is All You Need*, arXiv metadata: https://arxiv.org/abs/1706.03762 . First submission 2017-06-12; eight named authors. Full paper https://arxiv.org/pdf/1706.03762 (currently v7, 2023-08-02), first page, §§3.1, 3.5, 5.2 and 6.1. First page identifies NIPS 2017 and institutional footnotes; §5.2 supplies hardware/training duration. Current version is used for content; arXiv submission history for the original date.
- **S5a** Original GPT announcement, 2018-06-11: https://openai.com/index/language-unsupervised/ . Opened full official page.
- **S5b** Radford, Narasimhan, Salimans and Sutskever, *Improving Language Understanding by Generative Pre-Training*: https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf . Read model specifications: 12 decoder-only layers, 768-dimensional states, 12 heads, FFN 3072, sequences of 512 tokens, BPE with 40,000 merges. No literal `117` appears in extracted paper text.
- **S5c** OpenAI's released original GPT parameter-shape metadata: https://github.com/openai/finetune-transformer-lm/blob/master/model/params_shapes.json ; raw fetched source https://raw.githubusercontent.com/openai/finetune-transformer-lm/master/model/params_shapes.json . 146 tensors; summed product of tensor dimensions = **116,534,784** parameters. First two shapes are [512,768] position embeddings and [40478,768] token embeddings. This is an independent arithmetic check of the released pretrained tensors, not a number quoted from the paper and not a task-specific classifier count.
- **S5d** GPT-2 announcement, 2019-02-14: https://openai.com/index/better-language-models/ . Read announcement and staged-release section; largest model 1.5 billion parameters, initial release a smaller model, May interim release 345M under contemporary naming.
- **S5e** Radford et al., *Language Models are Unsupervised Multitask Learners*: https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf . Original Table 2 reports model sizes 117M/345M/762M/1542M. These are the paper's historical labels, not necessarily the corrected labels used for later downloadable models.
- **S5f** Final GPT-2 release, 2019-11-05: https://openai.com/index/gpt-2-1-5b-release/ . Opened official announcement: release of largest 1.5B model and weights completes staged release. Page also uses 355M/774M for smaller models, illustrating why historical approximate counts should not be mixed uncritically.
- **S5g** Brown et al., *Language Models are Few-Shot Learners*, arXiv metadata https://arxiv.org/abs/2005.14165 (first submission 2020-05-28; current v4 2020-07-22); full paper https://arxiv.org/pdf/2005.14165 . Read Table 2.1 and §2.1 (printed p. 8), Table 2.2 (p. 9), and visually inspected Figure 2.1 on printed p. 7. 75-page current PDF. Original date is taken from submission history, not current PDF date.
- **S5h** Official expansion of GPT in OpenAI's 2023 research abstract: https://openai.com/index/gpts-are-gpts/ . Opened page, whose first abstract sentence explicitly expands GPT as Generative Pre-trained Transformer.
- **S6a** Mikolov, Chen, Corrado and Dean, *Efficient Estimation of Word Representations in Vector Space*: https://arxiv.org/abs/1301.3781 (first submitted 2013-01-16), full paper https://arxiv.org/pdf/1301.3781 (v3 2013-09-07). Read §1.1, p. 2, famous formula; §4, p. 5, cosine-nearest-word method and exclusion of input words; reference [20], p. 12.
- **S6b** Mikolov, Yih and Zweig, *Linguistic Regularities in Continuous Space Word Representations*, NAACL-HLT 2013, pp. 746–751, conference 9–14 June 2013: https://aclanthology.org/N13-1090/ and https://aclanthology.org/N13-1090.pdf . Read abstract, §3 and §5. This is S6a's reference [20], using embeddings from an RNN language model; it explicitly gives the King–Man+Woman example and cosine-based vector-offset method.
- **S6c** Metadata for later word2vec paper: https://arxiv.org/abs/1310.4546 , *Distributed Representations of Words and Phrases and their Compositionality*, first submitted 2013-10-16, five authors Mikolov/Sutskever/Chen/Corrado/Dean. Not needed as the primary citation for the exact requested formula because S6a states it directly.

### H4 findings — status: corrected for the literal “attention only” wording; dates/counts confirmed

- Eight authors: Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin. Submitted to arXiv 2017-06-12; conference **NIPS 2017** (now called NeurIPS). Do not imply NeurIPS was the conference's contemporary acronym.
- Institutional attribution is broadly correct, but the exact title page lists Gomez at University of Toronto with a footnote that the work was done at Google Brain. Polosukhin has no institutional line, with a footnote that his work was done at Google Research. Other affiliations: Vaswani/Shazeer/Kaiser Google Brain; Parmar/Uszkoreit/Jones Google Research. Good deck wording: “Google Brain／Google Researchを中心とする8人（トロント大学のAidan Gomezを含む）”.
- The paper eliminates recurrence and convolution as sequence-processing mechanisms, and uses attention to model sequence dependencies. It also contains **position-wise fully connected feed-forward layers, embeddings, positional encoding, layer normalization and residual connections**. Thus an unqualified “attentionしか使わない” is technically misleading even though the abstract uses the “solely on attention mechanisms” shorthand. Prefer “再帰・畳み込みを使わず、attentionで系列の依存関係を扱うTransformerを提案”. Do not imply autoregressive output generation itself disappears.
- Machine translation is the main experimental setting (WMT 2014 English–German and English–French); the paper also tests constituency parsing. “機械翻訳のために提案” is a fair shorthand, not an exclusive claim that translation was its only possible task.
- §5.2 confirms one machine with **8 NVIDIA P100 GPUs**; big models **300,000 training steps, approximately 3.5 days**. Base models 100,000 steps/about 12 hours. Time is for the reported training run/configuration, not the whole research effort or all experiments.

### H5 findings — status: confirmed, with release/count/quotation qualifications

- GPT expands to **Generative Pre-trained Transformer**, explicitly supported by S5h. The 2018 paper title is *Improving Language Understanding by Generative Pre-Training*; avoid claiming that the full acronym expansion was the title of that paper.
- Original GPT announced **2018-06-11**, so June 2018 is correct. **Approximately 117M** is supported by the released metadata sum **116,534,784** (S5c). Label that exact value as a count computed from released pretrained tensors if it is included; the deck only needs the rounded value.
- GPT-2 announced **2019-02-14**, largest model roughly **1.5B** parameters. It was a staged release: the maximum-size weights were **not released publicly in February**, but on **2019-11-05**. Original paper Table 2 calls the largest model 1542M; “about 1.5B” is the stable, officially used figure. Do not mistake GPT-2's historically labeled 117M small variant for the distinct original 2018 GPT.
- GPT-3 paper first submitted **2020-05-28**, **175B** parameters. Table 2.1 states models trained for **300 billion tokens** (3,000億トークン). This is the count of training tokens processed, not an assertion that the underlying corpus contained exactly 300B distinct tokens. Table 2.2 lists a larger pool and weighted sampling/repeated exposure.
- The requested **few-shot panel** in Figure 2.1, p. 7, visually matches every supplied line, including lowercase examples, accent on `poivrée`, `=>`, and the unusual one-f spelling of `girafe` on the English side. Exact panel text (no final punctuation added):

```text
Translate English to French:
sea otter => loutre de mer
peppermint => menthe poivrée
plush girafe => girafe peluche
cheese =>
```

- **Preserve `plush girafe` when quoting the few-shot panel.** The adjacent fine-tuning panel instead has `plush giraffe` (two f's). The figure is internally inconsistent; silently correcting the few-shot spelling would cease to be an exact quotation. This illustration is a schematic explanation of prompting, not evidence that those exact examples were the complete translation benchmark prompt or that the displayed unfinished answer was a measured model result.

### C2 findings — status: confirmed, with attribution and mathematical qualification

- The exact requested form occurs in S6a, §1.1, p. 2: `vector(”King”) - vector(”Man”) + vector(”Woman”)`, followed by the statement that the resulting vector is closest to the vector representation of Queen. Original PDF extraction uses right double quotation marks on both sides; for readable mathematical display use normalized `vector("King") − vector("Man") + vector("Woman") ≈ vector("Queen")`, explicitly a normalized illustration rather than exact typeset transcription.
- Strong provenance: S6a itself credits reference [20], which is S6b by **Mikolov, Wen-tau Yih and Geoffrey Zweig**. S6b's abstract uses `King - Man + Woman` and says the result is very close to Queen; §3 specifies RNN-derived embeddings. Therefore “Mikolovら（2013）の単語ベクトル研究で報告された類推” is more historically precise than claiming CBOW/skip-gram uniquely discovered this result.
- This is **nearest-neighbor similarity, not exact vector equality or a guarantee for every trained word2vec model**. S6a §4 specifies cosine distance and discards input question words during search. S6b §5 normalizes input vectors to unit norm and searches for maximum cosine similarity. Retain the user's “closest” wording or use an approximation sign; do not use an unexplained equals sign.
- The request asks for exact form, not a full sentence quotation; the formula above avoids unnecessarily reproducing a long passage.

### C3 findings — status: confirmed

S5g Table 2.1 and §2.1 give GPT-3 175B: **96 layers**, **d_model 12,288**, **96 attention heads**, **2,048-token context window**. Head dimension 128 is consistent with 12,288/96. These figures describe the 175B member of a family of eight sizes; do not attach them to every model called GPT-3. The architecture alternates dense and locally banded sparse attention in its layers, a nuance available for detailed diagrams but unnecessary for the requested row.

### Method, unresolved points, next unit

- Text PDFs fetched in bounded memory (10MB maximum each), `pdftotext` subprocess timeout 15s, outer process timeout 60s. GPT-3 figure rendered in memory with installed `pdftoppm`: only page 7, longest image side 1800px, subprocess 20s and outer 55s time limits. No files except this append-only log were written. All subprocesses completed.
- Parameter metadata fetched with a 100KB cap; summed dimensions without loading any model weights or running inference. All calculations use only 146 small shape arrays.
- OpenAI documentation search and an accidental unrelated announcement link did not support historical claims and are not used as sources. Raw PDF extraction misses GPT-3 figure text; visual inspection is the evidence for exact example wording.
- No substantive uncertainty remains in these four item IDs. Later global coverage review should retain rounded-count provenance, contemporary NIPS naming, quote normalization, and the GPT-3 figure typo distinction.
- Next unit: **Unit 3**, H6–H7 timeline dates and ChatGPT adoption estimates from original announcements, metadata, Dartmouth proposal and Reuters/UBS reporting.
- Remaining research units: 3–11. The checkpoint threshold was raised at the beginning of this continuation; Unit 2 is now complete and durable. Checkpoint before Unit 3.

## Plan revision 3

Unit 3 confirms that a single timeline date can denote a paper submission, a product announcement, a limited preview, or general availability. Derived question: **which event does each date represent?** Pursue now within Unit 3 because an unqualified “release” would mislabel BERT, o1, and Codex. Also distinguish reported adoption estimates from audited counts; this does not require a new study of current ChatGPT usage. No units added or dropped. Remaining units after this unit: 4–11; the report remains a separate attendant-designated phase.

## Unit 3: H6–H7 — ChatGPT adoption and timeline event dates

Completed: 2026-10-09 UTC. Retrieval date for all sources below: 2026-10-09 (clock at start of unit: 17:03:02 UTC). Unit complete; no report drafted.

### Sources consulted

- **S7a** OpenAI, *Introducing ChatGPT*, dated 2022-11-30: https://openai.com/index/chatgpt/ . Opened date and research-preview introduction.
- **S7b** Sam Altman's original post URL: https://twitter.com/sama/status/1599668808285028353 (also https://x.com/sama/status/1599668808285028353). Direct access failed. Contemporary article reproduces the post, date and link: *The Indian Express*, 2022-12-05, https://indianexpress.com/article/technology/tech-news-technology/openai-chatgpt-crosses-1-million-users-ceo-says-they-might-have-to-monetise-this-8306997/ . Opened and read the embedded quotation. TIME later independently reports the five-day milestone: https://time.com/6342827/ceo-of-the-year-2023-sam-altman/ (2023-12-06; search excerpt consulted).
- **S7c** Krystal Hu, Reuters, *ChatGPT sets record for fastest-growing user base — analyst note*. Original URL https://www.reuters.com/technology/chatgpt-sets-record-fastest-growing-user-base-analyst-note-2023-02-01/ did not open. Read the Reuters syndication on Investing.com: https://www.investing.com/news/economy/chatgpt-sets-record-for-fastestgrowing-user-base--analyst-note-2993773 . It displays publication and update on **2023-02-02**; the story describes the UBS study as issued Wednesday, i.e. **2023-02-01**. Reuters video dated Feb 2 corroborates the numbers: https://finance.yahoo.com/video/chatgpt-fastest-growing-app-history-142338104.html (search result).
- **S8a** McCarthy, Minsky, Rochester and Shannon, original proposal transcription on McCarthy's Stanford site, dated **1955-08-31**: https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html . Read title, signatories, date and first paragraph. Institutional retrospective confirms the workshop occurred in summer 1956: https://ai.dartmouth.edu/founding-and-future-ai . Its broad “coined in 1956” wording must not override the dated 1955 primary proposal.
- **S8b** JMLR bibliographic record, *A Neural Probabilistic Language Model*: https://jmlr.org/papers/v3/bengio03a.html . Yoshua Bengio, Réjean Ducharme, Pascal Vincent, Christian Jauvin; **3(Feb):1137–1155, 2003**.
- **S8c** BERT arXiv metadata: https://arxiv.org/abs/1810.04805 . First submission **2018-10-11**, authors Jacob Devlin, Ming-Wei Chang, Kenton Lee and Kristina Toutanova. Google AI's official open-source announcement: https://research.google/blog/open-sourcing-bert-state-of-the-art-pre-training-for-natural-language-processing/ , dated **2018-11-02**, says release occurred “this week.” Official repository https://github.com/google-research/bert opened; README includes a Colab paragraph dated Oct 31, 2018. The November blog date alone is not proof the repository was first public on Nov 2.
- **S8d** GPT-4 announcement: https://openai.com/index/gpt-4/ , dated **2023-03-14**. Opened date and historical introduction.
- **S8e** Anthropic, *Introducing Claude*: https://www.anthropic.com/news/introducing-claude , dated **2023-03-14**. Read introduction: broader offering after several months of closed alpha with partners; Claude and Claude Instant offered.
- **S8f** Meta, *Introducing LLaMA*: https://ai.meta.com/blog/large-language-model-llama-meta-ai/ , dated **2023-02-24**. Read release and access terms: research-focused noncommercial license, access granted case by case. Official paper landing page also dated Feb 24: https://ai.meta.com/research/publications/llama-open-and-efficient-foundation-language-models/ (search result).
- **S8g** Google, *Introducing Gemini: our largest and most capable AI model*, dated **2023-12-06**: https://blog.google/innovation-and-ai/technology/ai/google-gemini-ai/ (old /technology/ai/ URL redirects). Read launch and availability: Gemini 1.0 family, Pro begins in Bard that day; developer/API availability starting Dec 13 and Ultra later.
- **S8h** OpenAI, *Introducing OpenAI o1-preview*: https://openai.com/index/introducing-openai-o1-preview/ , dated **2024-09-12**. Introduces o1 series and releases **o1-preview and o1-mini**. Contrast official *Introducing ChatGPT Pro*, **2024-12-05**, https://openai.com/index/introducing-chatgpt-pro/ , which includes the non-preview o1 and o1 pro mode.
- **S8i** Anthropic, *Introducing the Model Context Protocol*: https://www.anthropic.com/news/model-context-protocol , dated **2024-11-25**. Read first paragraphs and components of open release. Reuse this source in Unit 8 for A4; provider adoption dates and USB-C quote are not checked in this unit.
- **S8j** DeepSeek official change log https://api-docs.deepseek.com/updates/ , section **2025-01-20**, and release page https://api-docs.deepseek.com/news/news250120/ . Release page initially failed but succeeded through change-log link. It describes released models and live website/API. Change log has an apparent copy-edit error mentioning V3 in the R1 section; do not repeat it. Separate paper metadata https://arxiv.org/abs/2501.12948 gives **2025-01-22** as first submission.
- **S8k** Anthropic, *Claude 3.7 Sonnet and Claude Code*: https://www.anthropic.com/news/claude-3-7-sonnet , **2025-02-24**, explicitly calls Claude Code a **limited research preview**. *Introducing Claude 4*: https://www.anthropic.com/news/claude-4 , **2025-05-22**, explicitly announces Claude Code **generally available**.
- **S8l** OpenAI, *Introducing Codex*: https://openai.com/index/introducing-codex/ , dated **2025-05-16**. Read opening, which calls this a **research preview of a cloud-based software engineering agent**. Page has later updates, including June 3 expansion; those do not change the initial announcement date.
- **S6a/S6c reused from Unit 2** for word2vec dates: https://arxiv.org/abs/1301.3781 (2013-01-16) and https://arxiv.org/abs/1310.4546 (2013-10-16). Already retrieved 2026-10-09; no need for redundant rereading.

### H6 findings — status: confirmed, with source/metric qualifications

1. Public ChatGPT research preview launched **2022-11-30** (S7a). The original was described as a research preview, with free usage.
2. **One million users in about five days** is supported as a **company/Altman statement**, not an independently audited count (S7b). The contemporary reproduction dates the post **2022-12-05** and gives: `ChatGPT launched on wednesday. today it crossed 1 million users!` Do not label this one million daily or monthly active users; the post simply says users. Direct original X rendering could not be inspected; the date/text are supported by the contemporary article and its embedded source link.
3. Reuters reports that a UBS study estimated **100 million monthly active users in January 2023**, roughly two months after launch, using Similarweb data (S7c). This is a third-party estimate, not OpenAI's official registration count. Preserve both “estimated” and “monthly active.”
4. Reuters describes ChatGPT as the fastest-growing consumer application at that time and quotes the UBS analysts' historical comparison. Present this as **a contemporaneous UBS assessment reported by Reuters**, not an eternal record or a methodologically universal ranking.
5. The same Reuters story says **TikTok about nine months after its global launch**, **Instagram 2½ years** to reach 100 million users, attributing those comparison data to **Sensor Tower**. Thus the source chain is UBS/Similarweb for the ChatGPT estimate, and Sensor Tower for the comparison figures. The article does not provide enough methodology to prove perfectly comparable user definitions across all three services.
6. Citation date recommendation: “Reuters, 2023-02-02（UBSの2月1日付調査）.” The original URL contains Feb 1; syndication displays Feb 2 and was updated that day. The user's generic “Feb 2023” is correct. Do not infer publication timestamp solely from a URL.

Suggested Japanese display wording: “2022年11月30日、ChatGPTを研究プレビューとして公開。約5日で100万人に到達したとAltmanが発表。2023年1月の月間利用者数は約1億人とUBSが推計（Reuters報道）。” A separate comparison caption should carry “当時” and “推計.”

### H7 findings — status: corrected for event labeling; listed calendar dates confirmed

All supplied dates are defensible once the event is named. For an exact timeline use:

| Event | Verified date / wording | Evidence and limits |
|---|---|---|
| Dartmouth | **1956年夏、Dartmouth Summer Research Project on Artificial Intelligence**。提案書は **1955-08-31**。 | S8a; the term is already in the 1955 title/body. Avoid saying the phrase first appeared only at the 1956 meeting. |
| Bengio et al. | **2003年2月**, *A Neural Probabilistic Language Model*, JMLR 3:1137–1155. | S8b; this dates the requested journal article, not necessarily every precursor presentation. |
| word2vec | **2013年**; first relevant paper submitted Jan 16, later word/phrase compositionality paper Oct 16. | S6a/S6c; no need to pretend the whole project has a single exact day. |
| BERT | **2018-10-11、GoogleのBERT論文をarXivへ初投稿**。 | S8c; October is correct for the paper. Google open-source blog is Nov 2 and refers to release earlier that week. Do not misstate Oct 11 as the proven code/weights release date. |
| LLaMA | **2023-02-24、MetaがLLaMAを発表・研究向け提供**。 | S8f; restricted research access at launch, not unrestricted commercial/open-source availability. |
| GPT-4 | **2023-03-14、OpenAIがGPT-4を発表**。 | S8d. |
| Claude | **2023-03-14、AnthropicがClaudeを発表・提供拡大**。 | S8e; followed a closed alpha, not proof that nobody had access before that day. |
| Gemini | **2023-12-06、GoogleがGemini 1.0を発表**。 | S8g; Pro/Bard starts then; all variants and all API access were not simultaneously available. |
| OpenAI o1 series | **2024-09-12、o1-preview／o1-mini公開**。 | S8h; correct the short label from bare “o1 release” to preview/series announcement. Non-preview o1 appears in the Dec 5 ChatGPT Pro announcement. |
| MCP | **2024-11-25、AnthropicがMCPを公開**。 | S8i. |
| DeepSeek-R1 | **2025-01-20、モデル・API公開**。 | S8j; paper first submitted Jan 22, a separate event. |
| Claude Code preview | **2025-02-24、限定research preview**。 | S8k. |
| Codex cloud agent | **2025-05-16、クラウド型エージェントのresearch preview**。 | S8l; not the first appearance of the Codex name or Codex CLI. |
| Claude Code GA | **2025-05-22、一般提供開始**。 | S8k; preserve the preview/GA separation requested by the user. |

### Unresolved points, scope decisions, next unit

- Exact original X page rendering and the original UBS research note were inaccessible/not obtained. Contemporary sourced reporting is sufficient for the historical attributed claims; do not portray them as independently audited data.
- Exact day of BERT's initial public repository/weights access was not established. The user's October paper date is established; use that event wording. The Nov 2 blog's “this week” and README's Oct 31 timestamp rule out using blog publication alone as a precise first-release proof. Broader repository archaeology is deferred as unnecessary unless the deck specifically needs a code-release event.
- Current ChatGPT user totals use potentially different metrics and do not replace the January 2023 historical estimate. A general 2026 adoption survey is deferred; the task's explicitly current figures (C6 windows and A5 METR) remain planned.
- Official historical pages are mutable and include current banners/links. Only dated historical body statements were used. No installation, model loading, external writes, or project edits occurred.
- Next unit: **Unit 4**, C1/C4/C5/C7 — tokenizer code, Llama 3 token counts, Chinchilla and Kaplan scaling papers.
- Remaining research units: **4–11**. Attendant requested checkpoint at the beginning of this continuation; Unit 3 is now complete and durable. Request checkpoint before continuing.

## Plan revision 4

Unit 4 surfaced two definitional questions that matter to precise on-screen numbers: **does tokenizer vocabulary size mean the number of defined tokens or the highest token ID plus one?** and **does compute-optimal mean training FLOPs alone or lifetime training plus inference cost?** Pursue both within Unit 4 because they qualify C1/C5. The original rounded vocabulary claims remain appropriate; exact counts need a definition. Llama 3's much longer training provides a directly relevant example of the second distinction. A general survey of newer scaling-law fits or training recipes is deferred because it is not necessary to validate these historical claims. No units added or dropped. Remaining after this unit: 5–11, then the separate report phase.

## Unit 4: C1, C4–C5, C7 — tokenizer sizes, training tokens and scaling laws

Completed: 2026-10-09 UTC. All URLs below retrieved 2026-10-09; clock at unit start was 17:06:54 UTC. Unit complete; no report drafted.

### Sources consulted

- **S9a** OpenAI tiktoken model-to-encoding mappings: https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken/model.py . Read `MODEL_TO_ENCODING` and prefix mappings. Human-facing link: https://github.com/openai/tiktoken/blob/main/tiktoken/model.py . These are live `main` files, so this log records the retrieval date rather than claiming an immutable revision.
- **S9b** OpenAI tiktoken encoding constructors: https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken_ext/openai_public.py . Read `gpt2`, `cl100k_base`, `o200k_base`, their special-token definitions and expected data hashes. Human-facing link: https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py .
- **S9c** OpenAI tiktoken core: https://raw.githubusercontent.com/openai/tiktoken/main/tiktoken/core.py . `Encoding.n_vocab` returns `max_token_value + 1`; its docstring recommends that explicit expression instead.
- **S9d** Official token-rank data fetched into memory, counted and SHA-256 checked against S9b: https://openaipublic.blob.core.windows.net/encodings/cl100k_base.tiktoken and https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken . No tokenizer package was installed, no downloaded Python was executed, and no model weights were loaded.
- **S10a** Meta's original launch announcement, **2024-04-18**: https://ai.meta.com/blog/meta-llama-3/ . Read the first-release description and “Training data” / “Scaling up pretraining” sections.
- **S10b** Meta official original Llama 3 model card: https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md . Read the 8B/70B table, 15T+ count, pretraining-only note and April 18 release date.
- **S11a** Hoffmann et al., *Training Compute-Optimal Large Language Models*, arXiv first submission **2022-03-29**: https://arxiv.org/abs/2203.15556 ; full PDF https://arxiv.org/pdf/2203.15556 . Read abstract, §§1, 3.4, 4 and Tables 1–3. The served PDF has a 2023 copyright line while the arXiv metadata dates first submission to March 2022; the latter answers the requested publication timing.
- **S11b** DeepMind official explanation: https://deepmind.google/blog/an-empirical-analysis-of-compute-optimal-large-language-model-training/ (old `/discover/blog/` URL redirects). Opened as corroboration; use the paper as the primary quantitative source.
- **S12a** Kaplan et al., *Scaling Laws for Neural Language Models*, arXiv first submission **2020-01-23**: https://arxiv.org/abs/2001.08361 ; full PDF https://arxiv.org/pdf/2001.08361 . Read abstract, §1.1 / Figure 1 and §1.2 equations 1.1–1.3. This is an empirical language-model loss study.

### C1 findings — status: confirmed

S9a maps **GPT-4o → o200k_base**, **GPT-4 → cl100k_base**, **GPT-3.5-turbo → cl100k_base**. S9b explicitly gives **50,257** for GPT-2, including its end-of-text token. Thus the requested approximate 200k/100k labels are sound. Avoid extending the GPT-4 mapping to every later model with a name starting “GPT-4”; GPT-4o and GPT-4.1 have their own mappings.

Optional exact technical counts (S9b–S9d), useful only if the deck needs more precision:

| Encoding | Mergeable tokens | Defined special tokens | Defined-token total | Highest ID + 1 (`n_vocab`) |
|---|---:|---:|---:|---:|
| cl100k_base | 100,256 | 5 | 100,261 | 100,277 |
| o200k_base | 199,998 | 2 | 200,000 | 200,019 |

The ID ranges have gaps, so `n_vocab` is not the count of defined entries. The constructors are public base encodings; this does not establish the total private protocol/control-token inventory inside a served chat model. Prefer the original “約10万／約20万” on screen.

Reproducibility: cl100k data was 1,681,126 bytes, rank range 0–100255, SHA-256 `223921b76ee99bde995b7ff738513eef100fb51d18c93597a113bcffe865b2a7`; o200k was 3,613,922 bytes, rank range 0–199997, SHA-256 `446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d`. Counts were computed from the official rank-file lines, then added to the constructor's special-token counts.

### C4 findings — status: confirmed

**Llama 3's April 18, 2024 release (8B and 70B) was pretrained on over 15 trillion tokens (15兆超).** S10a states the amount; S10b explicitly says token counts concern **pretraining data only**. Do not relabel this as the number of words, documents, parameters, or instruction-tuning examples. This verifies the original Llama 3 release rather than substituting a later Llama 3.1 family figure.

S10a also says the smaller models kept improving with training up to 15T tokens and explains the inference-efficiency motivation for using smaller models trained longer. This is directly useful context for C5: training beyond the Chinchilla training-compute optimum can be intentional.

### C5 findings — status: confirmed, with the optimization objective stated

S11a supports **Chinchilla 70B parameters, 1.4T training tokens**, trained with the same FLOPs budget as **Gopher 280B**, and outperforming Gopher across a broad evaluation suite. The displayed ratio is **1.4 trillion / 70 billion = 20 tokens per parameter**. Table 3's estimated optima also support an approximate 20:1 rule, not an exact universal constant. The three fitting methods yield slightly different exponents; the paper's main conclusion is approximately equal scaling of model size and training tokens as training compute grows.

Suggested wording: “学習計算量を一定にしたとき、モデル規模と学習トークン数を釣り合せる。Chinchillaは700億パラメータを1.4兆トークンで学習し、同程度の学習計算量でGopher（2800億）を上回った。約20トークン／パラメータはこの研究の目安。”

Do not present 20 as a mandatory cap, as a universally optimal recipe, or as the optimum for total lifetime cost. S10a provides a concrete subsequent inference-oriented departure from this training-only objective. Nor does “outperformed” mean every individual task under every setting.

### C7 findings — status: confirmed, with regime/metric qualifications

S12a first appeared **2020-01-23**. It reports empirical power-law scaling of held-out **cross-entropy language-model loss** with model size, dataset size and training compute, when the other factors do not impose the bottleneck. It is not a claim that every downstream benchmark score or an undefined “intelligence” metric follows the same curve.

If equations are shown, §1.2 gives approximate exponents **0.076** for model size (non-embedding parameters), **0.095** for dataset tokens and **0.050** for optimally allocated compute: loss is proportional to the corresponding quantity raised to the negative exponent, within the studied regimes. The paper separately reports **0.057** for its fixed-batch compute relation; avoid mixing these compute definitions. No exponent is needed for the user's simple claim.

The C5 findings refine the compute allocation recommendation, rather than invalidating the broad observation that loss can follow empirical power laws. Do not imply Kaplan's original optimal model/data allocation and Chinchilla's later allocation are identical.

### Unresolved points, methods, next unit

- No substantive unresolved factual point remains for these four IDs. Exact tokenizer internals beyond the public encodings are not established and are unnecessary for C1's approximate claim.
- The two data downloads were a fixed finite set, each capped before accumulation at 6,000,001 bytes (reject over 6MB), with 15-second network timeouts and a 55-second outer process timeout. Only compact counts/hashes were printed. The process completed with exit code 0. No installation, GPU work, project edits, or files outside this log were created.
- Broader newer scaling-law research is deferred; any production training decision would require a separate task-specific analysis of data, architecture and inference volume. This research does not recommend running a training job.
- Next unit: **Unit 5, C6** — historical context windows and the largest generally available context window at the research cutoff. Clearly define GA versus preview and distinguish advertised model capability from provider availability.
- Remaining research units: **5–11**. The checkpoint threshold was reached at the start of this continuation; Unit 4 is now complete and durable. Request checkpoint before Unit 5. Report must still wait for the explicit report turn after all research units finish.

## Plan revision 5

C6's phrase “largest generally available context window” needs an availability definition. A public model's specified window, a particular hosted API's limit, and a research demonstration are different claims. **Pursue this derived question now within Unit 5**: check released weights and active provider documentation, and exclude research-only demonstrations from the availability comparison. This does not change the original question; it makes the requested superlative meaningful. Use “largest documented among the publicly released models checked, as of 2026-10-09” rather than an unbounded worldwide maximum. Detailed testing of every provider/account and long-context quality is deferred. Remaining after Unit 5: 6–11, then the separate report phase.

## Unit 5: C6 — historical context windows and current publicly available maximum

Completed: 2026-10-09 UTC. All sources below retrieved 2026-10-09; clock at unit start was 17:09:28 UTC. Unit complete; report not drafted. Continued the previously applied OpenAI Docs workflow: searched official documentation and fetched the exact GPT-4 page, then used the original historical announcement for March 2023 access terms.

### Sources consulted

- **S13a** OpenAI GPT-4 historical announcement, March 14, 2023: https://openai.com/index/gpt-4-research/ . Opened and read API section, including both exact context lengths, waitlist and limited 32K access. The current GPT-4 model page also lists 8,192: https://developers.openai.com/api/docs/models/gpt-4 (fetched via official documentation tool); do not use mutable modern snapshot metadata to reconstruct all historical facts.
- **S13b** Anthropic, *Introducing 100K context windows*, **2023-05-11**: https://www.anthropic.com/news/100k-context-windows . Opened: expansion from 9K to 100K.
- **S13c** Anthropic, *Introducing Claude 2.1*, **2023-11-21**: https://www.anthropic.com/news/claude-2-1 . Opened: 200,000-token window, API availability, claude.ai free/Pro availability, with 200K reserved for Pro in the chat product.
- **S13d** Google, *Our next-generation model: Gemini 1.5*, **2024-02-15**: https://blog.google/innovation-and-ai/products/google-gemini-next-generation-model-february-2024/ . Opened: standard 128K, 1M private preview for a limited group via AI Studio/Vertex AI, and research testing up to 10M.
- **S13e** Google developer announcement, **2024-05-14**: https://blog.google/innovation-and-ai/technology/developers-tools/gemini-gemma-developer-updates-may-2024/ . Opened: 1M available in 1.5 Pro/Flash, 2M private preview with waitlist.
- **S13f** Google Developers Blog, **2024-06-27**: https://developers.googleblog.com/en/new-features-for-the-gemini-api-and-google-ai-studio/ . Opened: 2M context for Gemini 1.5 Pro opened to all developers that day. This dates the general developer opening rather than the first preview announcement.
- **S14a** Meta, *The Llama 4 herd*, **2025-04-05**: https://ai.meta.com/blog/llama-4-multimodal-intelligence/ . Opened: Scout's 10M context and availability of Scout/Maverick downloads that day; Behemoth separately described as still in training. Official model card on Meta's Hugging Face account: https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct . Opened: 10M table entry, April 5 release, custom Llama 4 commercial license. “Publicly released/open-weight” is preferable to an unqualified “open source.”
- **S14b** AWS current Llama 4 Scout model card: https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-meta-llama-4-scout-17b-instruct.html . Opened: **Active**, **10M tokens** context, 8K max output, Bedrock runtime/Converse support, US regional inference information. Current quota reference: https://docs.aws.amazon.com/general/latest/gr/bedrock.html . Opened and located explicit **Llama 4 Scout 17B Instruct 10M** provisioned-throughput entry, separately from 128K, with default model-unit quota **0**, adjustable. This is stronger evidence of a documented hosted offering than copying Meta's architecture description alone. Account access/capacity was not tested.
- **S14c** Groq Scout model documentation: https://console.groq.com/docs/model/meta-llama/llama-4-scout-17b-16e-instruct/ . Opened: historical 128K hosted window, demonstrating provider-specific limits. Current deprecation page https://console.groq.com/docs/deprecations opened: free/developer-tier Scout access shut down **2026-07-17**; enterprise committed-spend customers excluded from that shutdown. Do not cite the lingering model page as evidence of current universal availability on Groq.
- **S14d** Magic, *100M Token Context Windows*, **2024-08-29**: https://magic.dev/blog/100m-token-context-windows . Opened research update: trained LTM-2-mini with 100M tokens, prototype evaluation and future large LTM-2 training. Current homepage https://magic.dev/ opened; describes building frontier code models, without a public model/API offering in the inspected text. Searches on the official domain did not establish GA. Absence of a located release is not proof that no private deployment exists.
- **S14e** MiniMax, *MiniMax-01 is Now Open-Source*, **2025-01-15**: https://www.minimax.io/news/minimax-01-series-2 . Opened: released Text-01/VL-01, 4M supported context, links to API platform and model access. Paper metadata consulted: https://arxiv.org/abs/2501.08313 — training up to 1M, inference extrapolation to 4M. This is below Scout's documented 10M; current full-size API access was not independently established.
- **S14f** Current OpenAI model catalog https://developers.openai.com/api/docs/models and exact Astra page https://developers.openai.com/api/docs/models/gpt-6-astra . Opened catalog and fetched exact page through official docs tool: GPT-6 Astra context **1,050,000**, max input **922,000**, max output **128,000**. Catalog also lists GPT-6.1 Sol and GPT-6 Luna at 1.05M. These are current comparison checks, not additions to the historical timeline.
- **S14g** Current Anthropic Opus 5.5 model page: https://platform.claude.com/docs/en/models/opus-5-5/overview . Opened: 1M context, 128K output, Active, released September 22, 2026. Comparison table lists Fable 5.1 and Sonnet/Haiku 5.5 at 1M too. Current pricing page and release notes were also searched: https://platform.claude.com/docs/en/about-claude/pricing and https://platform.claude.com/docs/en/release-notes/overview ; March 13, 2026 note says 1M became non-beta for Opus/Sonnet 4.6. The fully opened model page is the preferred evidence for this current comparison.
- **S14h** Current Google catalog https://ai.google.dev/gemini-api/docs/models opened, then followed the stable flagship Flash link to https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash . Opened table: stable `gemini-3.8-flash`, **1,048,576 input tokens**, **65,536 output tokens**, page last updated **2026-09-02**. Do not conflate its input limit with OpenAI's combined context accounting.
- Broad web searches for 2026 maxima, 10M/20M/100M models and official provider sources supplied candidate discovery. Secondary aggregators and Reddit results were not used to establish technical facts or availability. NVIDIA's model listing appeared in discovery with a 10M architectural specification and a deprecated free endpoint, but it was not needed as evidence after the AWS primary documentation check.

### C6 findings — status: corrected (availability qualifiers); numerical historical claims confirmed

| Historical item | Verified value and date | Qualification for the deck |
|---|---|---|
| GPT-4 | **8,192 / 32,768 tokens**, March 14, 2023 (S13a) | API began with a waitlist; 32K had limited access. These are separate model variants, not a universal ChatGPT UI limit. |
| Claude | **100,000**, May 11, 2023 (S13b) | Expansion from 9K. |
| Claude 2.1 | **200,000**, November 21, 2023 (S13c) | API model capability; in claude.ai, 200K required Pro. |
| Gemini 1.5 Pro, initial announcement | **1,000,000**, February 15, 2024 (S13d) | **Private preview** for a limited group; standard context was 128K. Do not label the 1M window GA that day. |
| Gemini 1.5 Pro, later expansion | **2,000,000** preview announced May 14, 2024; opened to all developers June 27, 2024 (S13e/S13f) | Separate preview from general developer availability. Research tests up to 10M are a third category. |

**Current answer, scoped and dated:** As of **2026-10-09**, the largest documented window among the publicly released general-purpose models checked is **Llama 4 Scout: 10 million tokens (1,000万)**. Meta released the weights on April 5, 2025 (S14a), and AWS's current active model card plus separate 10M provisioned-throughput quota entry provide corroborating hosted-offering documentation (S14b). No larger generally available model was established in this search. This is a source-backed comparison result, not proof that every model or private contract in the world was exhaustively surveyed.

Operational definition used here: a released model obtainable for deployment under its published license, or a production service documented as active/available under ordinary provider terms, rather than research-only or limited preview access. “GA” is a formal stage label for some hosted services; Meta's downloadable weights need the different wording **publicly released**. If the report needs one short answer, use “公開済みモデルの公称値では、今回確認した最大はLlama 4 Scoutの1,000万トークン（2026-10-09調査）。実際のAPI上限は提供元・契約による。” Do not silently treat a downloadable model and every free/self-serve API as identical.

Magic's 100M announcement is **not a verified GA counterexample**: the opened source is a research update and this search found no public offering establishing the same window (S14d). MiniMax-01's 4M is below 10M (S14e). Current sampled OpenAI/Anthropic/Google models are around 1M (S14f–h), and do not displace Scout's documented maximum.

A window is a nominal input/context capacity, not a guarantee that all information is accurately retrieved or reasoned over. Input, output, combined context, cached history and application-level memory must not be added together or compared without checking provider definitions. In particular, a chat application's history capacity can differ from the underlying model/API.

### Uncertainties, derived questions and next unit

- The worldwide superlative cannot be proven exhaustively. The report must retain the date and “among checked publicly released models” scope. Use **corrected** for C6 with a clearly marked residual uncertainty about an unqualified worldwide maximum; do not erase the confirmed historical values.
- No actual 10M request was sent, no account entitlement/region capacity was tested, and no model was loaded. AWS's 0 default quota means the documentation is not a promise that any new account can immediately run that configuration. If the Boss instead needs “largest instantly usable self-serve API for this account,” that is a **deferred derived question** requiring account/provider constraints and a separate availability check; it is not necessary for the historical explainer.
- Long-context quality, tokenization differences between providers, cost and latency are separate from nominal capacity. A cross-model quality benchmark is **deferred**, not inferred from window size or marketing claims.
- Only read-only web/documentation research and append-only log writing occurred. No installs, GPU workloads, paid inference, or project edits.
- Next unit: **Unit 6, T1–T2** — InstructGPT's preference result, paper/blog dates and method; Chat Completions introduction, message roles, and the precise scope of statelessness in OpenAI/Anthropic APIs.
- Remaining research units: **6–11**. The attendant requested a checkpoint at this turn's start; Unit 5 is now complete and durable. Request checkpoint/compaction before Unit 6. Report remains reserved for the explicit report turn after the ready-to-report boundary.

## Plan revision 6

Unit 6 confirms that “chat APIs are stateless” needs an endpoint-specific scope: current OpenAI documentation explicitly contrasts manually managed Chat Completions with Responses/Conversations state management. **Pursue this derived question within Unit 6**, since it prevents the original explanation from becoming a false universal claim. Also distinguish an article's later update date from its launch date: the ChatGPT API launch page now displays an April 2024 update, so use the contemporaneous official announcement for March 2023. No new units added or dropped. Remaining after Unit 6: 7–11; report phase remains separate.

## Unit 6: T1–T2 — InstructGPT evidence and dates; chat API roles and statelessness

Completed: 2026-10-09 UTC. All sources below retrieved 2026-10-09; clock at the start of this continuation read 17:13:27 UTC. Unit complete; no report drafted. Continued the previously announced OpenAI Docs skill, using direct official documentation search then fetching the conversation-state guide before historical-source web research. Original papers, historical announcements and Anthropic documentation are included as expressly requested by the Boss.

### Sources consulted

- **S15a** Ouyang et al., *Training language models to follow instructions with human feedback*, arXiv metadata: https://arxiv.org/abs/2203.02155 . Read abstract and submission history: first submission **2022-03-04 07:04:42 UTC**, v1. Full paper https://arxiv.org/pdf/2203.02155 opened; read §3.1 (three steps), §3.5/model-training discussion around printed p. 9 (PPO, PPO-ptx), and preference results around printed p. 11. The abstract explicitly identifies the 1.3B-versus-175B preference finding.
- **S15b** OpenAI, *Aligning language models to follow instructions*, **2022-01-27**: https://openai.com/index/instruction-following/ . Opened full announcement; read results, methods, limitations and notes. Confirms the parameter comparison, demonstrations → comparison-trained reward model → PPO sequence, and reports models becoming API defaults. This blog date precedes the arXiv submission date.
- **S16a** Original launch article URL: https://openai.com/index/introducing-chatgpt-and-whisper-apis/ . Opened. Current displayed heading is *Introducing APIs for GPT-3.5 Turbo and Whisper* and the page displays **Updated: April 24, 2024**. It says the “ChatGPT API” name was discontinued in that update, announces `gpt-3.5-turbo` / `gpt-3.5-turbo-0301`, and explains message-based input and a new endpoint. The updated date is not the original launch date.
- **S16b** Contemporaneous OpenAI developer announcement by Logan Kilpatrick, **2023-03-01**, with link to S16a: https://community.openai.com/t/introducing-chatgpt-and-whisper-apis/80485 . Opened the dated opening announcement. Use this authored announcement for launch dating; ordinary forum replies are not needed as authoritative technical evidence.
- **S16c** Official OpenAI Cookbook, *How to format inputs to ChatGPT models*: https://developers.openai.com/cookbook/examples/how_to_format_inputs_to_chatgpt_models (redirect from https://cookbook.openai.com/examples/how_to_format_inputs_to_chatgpt_models). Opened examples and the section specifically discussing `gpt-3.5-turbo-0301`; shows `system`, `user`, `assistant` messages. This is a maintained cookbook page, not a frozen March 1 facsimile, but it explicitly documents that historical model.
- **S16d** OpenAI official *Conversation state* guide: https://developers.openai.com/api/docs/guides/conversation-state . Fetched full markdown via official documentation tool and read manual-state, Conversations API, and `previous_response_id` sections. Documents stateless generation requests and separately documents server-managed conversation continuity.
- **S16e** OpenAI official *Migrate to the Responses API*: https://developers.openai.com/api/docs/guides/migrate-to-responses . Opened, located direct comparison of manually managed Chat Completions with Responses/Conversations. Also examined the storage discussion; persistence/retention must not be confused with automatic incorporation into a subsequent generation.
- **S16f** Anthropic official *Using the Messages API*: https://platform.claude.com/docs/en/build-with-claude/working-with-messages . Opened, read “Multiple conversational turns,” request examples, and current “System role in messages” section. Explicitly documents statelessness and full history input. The guide distinguishes direct Messages prompting from Managed Agents.

### T1 findings — status: confirmed

**Paper first posted to arXiv: March 4, 2022. OpenAI blog announcement: January 27, 2022.** Do not collapse these into one date or label the January blog date as the arXiv publication date (S15a/S15b).

The paper reports that evaluators preferred the **1.3B (13億) InstructGPT** outputs over the **175B (1750億) GPT-3** outputs on its evaluated prompt distribution (S15a). This is a human preference result for those tasks and comparison conditions, not a universal statement that the smaller model surpassed the larger model on every ability or benchmark. Do not attach the paper's separately reported 85% preference statistic for **175B** InstructGPT to the **1.3B** comparison.

The requested method is accurate: supervised fine-tuning on human demonstrations; learning a reward model from human output comparisons/rankings; optimizing the policy against that reward using **PPO**. The paper's default “InstructGPT” refers to **PPO-ptx**, which also mixes pretraining gradients during RL to reduce regressions on public NLP datasets (S15a). For an introductory diagram, the three-step description is sufficient; if claiming to reproduce the precise training objective, include that qualification. This work applies earlier RLHF research rather than inventing RLHF for the first time (S15b).

Suggested compact factual wording: “人間の実演で教師あり微調整し、回答の比較から報酬モデルを学習、その報酬を使ってPPOで調整。評価対象のプロンプトでは、13億パラメータのInstructGPTの回答が1750億のGPT-3より好まれた。”

### T2 findings — status: corrected for scope; launch date and roles confirmed

**March 1, 2023** is the ChatGPT/GPT-3.5 Turbo API launch date (S16a/S16b). The Chat Completions interface uses messages with `system`, `user`, and `assistant` roles; the official cookbook explicitly covers the `gpt-3.5-turbo-0301` snapshot (S16c). On a timeline, use the original launch date even though the maintained announcement now displays an April 24, 2024 terminology update.

Short exact excerpts, each within a 25-word per-source quotation budget:

- OpenAI's migration guide: **“In Chat Completions, conversation state must be managed manually.”** (S16e; 11 words.)
- Anthropic's guide: **“The Messages API is stateless, which means that you always send the full conversational history to the API.”** (S16f; 22 words.)

For these interfaces, the application supplies the conversation context in each request; a previous API call does not automatically create a continuing conversational session. “Send the whole conversation” describes the normal full-history pattern. It should not imply that every message ever exchanged is a protocol requirement: the application chooses the retained context, potentially truncating or summarizing it as needed. Information omitted from that supplied context is not automatically recovered merely because it was sent in an earlier request.

**Do not generalize this to all present-day chat APIs.** OpenAI's Responses API supports `previous_response_id`, and its Conversations API persists state under a durable identifier (S16d/S16e). Consequently an application can continue a conversation without retransmitting the entire history text itself. Server-side storage or prompt caching is also distinct from the question of who constructs the next call's context.

Suggested factual wording: “OpenAI Chat CompletionsとAnthropic Messagesは、アプリ側が会話履歴を管理して各リクエストへ渡す方式。OpenAI Responsesなどにはサーバー側で会話状態を引き継ぐ方式もある。”

Role note: the requested three-role claim concerns OpenAI's launch interface. Avoid appending a timeless claim that Anthropic can never accept `role: system`: the current Messages guide documents mid-conversation system messages on certain newer models, while instructions applying from the start use its top-level `system` field (S16f). A full contemporary role-schema comparison is outside this historical explainer's scope.

### Unresolved points, methods, and next unit

- No substantive unresolved fact remains for T1 or the corrected T2. The exact original March 2023 page rendering was not archived in this task; launch dating is independently anchored by the contemporaneous official announcement, and roles by the historical-model cookbook.
- **Deferred derived question:** detailed architecture/performance tradeoffs between manually managed and server-managed conversation state. Necessary only if building an application, not for the requested historical/conceptual fact-check.
- Read-only web/documentation research and append-only log writing only. No software installation, model load, API inference, project edit, or downloaded artifact was created.
- Next unit: **Unit 7, T3** — original Mata v. Avianca sanctions opinion/order: six invented cases, an exact example name, June 22, 2023 date, Judge Castel, sanction amount and grounds.
- Remaining research units: **7–11**. The checkpoint threshold warning arrived at the start of this continuation; Unit 6 is now complete and durable. Request checkpoint before starting Unit 7. Report remains reserved for the explicit report turn after the ready-to-report boundary.

## Plan revision 7

Unit 7 resolves a counting ambiguity: the familiar **six** counts the fabricated opinions submitted as exhibits, while those opinions contain additional nonexistent or misrepresented citations. **Pursue this distinction within Unit 7** because an unqualified total could mislead the deck reader. No additional research unit is needed. Remaining after Unit 7: 8–11; the report phase remains separate.

## Unit 7: T3 — Mata v. Avianca sanctions, six fabricated opinions, and the penalty

Completed: 2026-10-09 UTC. All sources below retrieved 2026-10-09; clock at the start read 17:15:55 UTC. Unit complete; no report drafted.

### Sources consulted

- **S17a** Original court document, *Opinion and Order on Sanctions*, S.D.N.Y., No. 22-cv-1461 (PKC), ECF 54, filed **2023-06-22**, hosted on the official U.S. District Court for New Hampshire website: https://www.nhd.uscourts.gov/sites/default/files/pdf/Mata-v-Avianca-sanctions-order.PDF . Opened the 43-page PDF and read pp. 1–2, 6–9, 12–15, 31, 33–34. This is an S.D.N.Y. decision despite its mirror's New Hampshire hostname. Main opinion ends at p. 34; remaining pages are attached material. This government judicial opinion is the primary factual source.
- **S17b** Same ECF 54 document and signed-order metadata mirrored by Justia: https://law.justia.com/cases/federal/district-courts/new-york/nysdce/1:2022cv01461/575368/54/ . Opened; metadata identifies **Judge P. Kevin Castel** and June 22, 2023. Used as an accessible HTML alternate to S17a, not an independent ruling.
- **S17c** Court's earlier *Order to Show Cause*, ECF 31, **2023-05-04**, mirrored by Justia: https://docs.justia.com/cases/federal/district-courts/new-york/nysdce/1:2022cv01461/575368/31 . Opened original-document transcription; explicitly identifies six submitted cases as apparently bogus, before the later final sanctions findings. This establishes the origin/scope of the familiar count.
- ECF 55 (same date, separate order dismissing the underlying claim) appeared in discovery but was not needed for T3. Do not confuse it with ECF 54 or imply that the damages case's dismissal itself was this $5,000 sanction.

### T3 findings — status: confirmed, with precision notes

On **June 22, 2023**, **Judge P. Kevin Castel**, S.D.N.Y., sanctioned **Peter LoDuca, Steven A. Schwartz, and Levidow, Levidow & Oberman P.C.** in *Mata v. Avianca, Inc.* (S17a/S17b). The **$5,000 total penalty** was imposed **jointly and severally**, payable to the court; it was not $5,000 per lawyer. Prefer Japanese **制裁金** to wording suggesting a criminal conviction.

**Six fabricated opinions** were the submitted exhibits identified by the orders: **Varghese, Shaboon, Petersen, Martinez, Durden, and Miller** (S17a conclusion; S17c). A suitable full example, as cited in ECF 54 p. 7, is **Varghese v. China Southern Airlines Co., Ltd., 925 F.3d 1339 (11th Cir. 2019)**. Clearly label this as a **fabricated citation**, not an actual authority. The count is not an exhaustive total of every false citation nested inside those opinions; the court also discusses additional nonexistent/misrepresented citations (S17a pp. 12–13).

The court attributes the fabricated material to **ChatGPT** and finds bad faith involving continued reliance, conscious avoidance, and misleading statements after the citations were challenged. The sanctions rested on Rule 11 or, alternatively, the court's inherent authority. They also required notification of the client and falsely named judges (S17a pp. 1–2, 31, 33–34). Avoid reducing the grounds to merely using AI.

Suggested compact deck wording: “2023年6月22日、米ニューヨーク南部地区連邦地裁は、ChatGPTが生成した架空の判例を提出し、その後も虚偽の説明などを重ねた弁護士2名と法律事務所に、合計5,000ドルの制裁金を連帯して負担するよう命じた。提出された架空の判決文は6件。”

### Unresolved points, methods, and next unit

- No substantive uncertainty remains for the requested date, judge, amount, count or example. Fake-case spellings vary in different filings (e.g. Peterson/Petersen and shortened airline names); use the final opinion's **Petersen** in the six-item list and its p. 7 **Varghese** citation above. No need to reproduce all fabricated citations in the deck.
- Read-only court-record research and append-only log writing only. No project changes or external actions.
- Next unit: **Unit 8, A1–A4** — function/tool calling dates, Toolformer and ReAct, SWE-bench counts, MCP wording and ecosystem support chronology.
- Remaining research units: **8–11**. The attendant requested checkpoint/compaction at this turn's start. Unit 7 is complete and durable; checkpoint before Unit 8. Do not draft the report until the explicit report turn after the ready-to-report boundary.

## Plan revision 8

Unit 8 found that the MCP ecosystem dates mix **company endorsement, SDK support, preview availability, and native operating-system integration**. This derived question is **pursued within Unit 8**, because “Microsoft support began May 2025” is too broad: Copilot Studio announced an initial release in March. Preserve product-specific milestones and separate announced future support from delivered support. No new research units are added. Remaining after Unit 8: 9–11; the report phase remains separate.

## Unit 8: A1–A4 — tool calling, ReAct, SWE-bench and MCP adoption chronology

Completed: 2026-10-09 UTC. Every source below retrieved 2026-10-09; clock at start read 17:17:35 UTC. Unit complete; no report drafted. Continued the already announced OpenAI Docs skill: searched official docs and fetched the current MCP guide before researching historical announcements. The Boss's requested original papers and historical sources determine source scope.

### Sources consulted

- **S18a** OpenAI, *Function calling and other API updates*, **2023-06-13**: https://openai.com/index/function-calling-and-other-api-updates/ . Opened original announcement; read function-calling section and model descriptions. A later July 20 update appears within the article but does not change its launch date.
- **S18b** Anthropic, *Claude can now use tools*, **2024-05-30**: https://www.anthropic.com/news/tool-use-ga , currently redirects to https://claude.com/resources/articles/tool-use-ga . Opened dated article; first paragraph explicitly says generally available across the Claude 3 family and names Messages API, Amazon Bedrock and Vertex AI.
- **S18c** Schick et al., *Toolformer: Language Models Can Teach Themselves to Use Tools*, metadata https://arxiv.org/abs/2302.04761 ; paper https://arxiv.org/pdf/2302.04761 . Read abstract, submission history and first-page affiliation. First arXiv submission **2023-02-09 16:49:57 UTC**. Affiliations: Meta AI Research, plus Universitat Pompeu Fabra for Roberto Dessì.
- **S19a** Yao et al., *ReAct: Synergizing Reasoning and Acting in Language Models*, metadata https://arxiv.org/abs/2210.03629 ; paper https://arxiv.org/pdf/2210.03629 . Read abstract, submission history and first page. First arXiv submission **2022-10-06 01:00:32 UTC**; current v3 is 2023-03-10 and explicitly headed “Published as a conference paper at ICLR 2023.” First page identifies Princeton and Google Research, Brain team.
- **S19b** Authors' ReAct project page: https://react-lm.github.io/ . Opened abstract, prompting explanation and examples. OpenReview page https://openreview.net/forum?id=WE_vluYUL-X returned a browser verification screen, so use the paper's own conference imprint, not an unread OpenReview page.
- **S20a** Jimenez et al., *SWE-bench: Can Language Models Resolve Real-World GitHub Issues?*: https://arxiv.org/abs/2310.06770 . Read abstract and metadata: first submission **2023-10-10 16:47:29 UTC**; **ICLR 2024**; **2,294** problems from **12** Python repositories. Current metadata is for v3 (2024-11-11), while the submission history anchors the original date.
- **S20b** OpenAI, *Introducing SWE-bench Verified*, **2024-08-13**: https://openai.com/index/introducing-swe-bench-verified/ . Opened and read the Verified/data-construction section. **500** samples, a human-validated subset created with the SWE-bench authors. Page also states updated 2025-02-24; do not substitute that for original release date.
- **S21a** Anthropic, *Introducing the Model Context Protocol*, **2024-11-25**: https://www.anthropic.com/news/model-context-protocol . Opened announcement and standard/open-source description.
- **S21b** Official MCP introductory documentation: https://modelcontextprotocol.io/docs/getting-started/intro , redirects at retrieval to https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro . Read introductory definition and USB-C analogy. This is the current retrieved documentation, not a frozen November 2024 page.
- **S21c** Sam Altman's original MCP announcement, **2025-03-26**: https://x.com/sama/status/1904957253456941061 . Direct web open failed, but **X's own public oEmbed endpoint returned author, full post text and date**, read successfully using bounded shell HTTP fetch: https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2Fsama%2Fstatus%2F1904957253456941061&omit_script=true . This is primary post evidence, not reliance on a third-party paraphrase.
- **S21d** OpenAI, *New tools and features in the Responses API*, **2025-05-21**: https://openai.com/index/new-tools-and-features-in-the-responses-api/ . Opened announcement; remote MCP server support is a new Responses API feature on this date. Also fetched current official guide https://developers.openai.com/api/docs/guides/tools-connectors-mcp using the documentation tool, to establish present-day endpoint scope, not historical launch dating.
- **S21e** Demis Hassabis's original MCP announcement, **2025-04-09**: https://x.com/demishassabis/status/1910107859041271977 . Direct web open failed; X's own oEmbed endpoint successfully returned author, complete post and date: https://publish.twitter.com/oembed?url=https%3A%2F%2Fx.com%2Fdemishassabis%2Fstatus%2F1910107859041271977&omit_script=true . Primary post evidence.
- **S21f** Google, *Gemini 2.5: Our most intelligent models are getting even better*, **2025-05-20**: https://blog.google/technology/google-deepmind/google-gemini-updates-io-2025/ , redirects to https://blog.google/innovation-and-ai/models-and-research/google-deepmind/google-gemini-updates-io-2025/ . Opened date and developer/MCP section; explicitly says native SDK support for MCP definitions was added in the Gemini API.
- **S21g** Microsoft, *Introducing Model Context Protocol (MCP) in Copilot Studio*, **2025-03-19**: https://www.microsoft.com/en-us/copilot/blog/copilot-studio/introducing-model-context-protocol-mcp-in-copilot-studio-simplified-integration-with-ai-apps-and-agents/ . Opened full official article. Calls this the first release; describes initial preview-region availability and forthcoming broader environment rollout.
- **S21h** Windows Developer Blog, *Advancing Windows for AI development: New platform capabilities and tools introduced at Build 2025*, **2025-05-19**: https://blogs.windows.com/windowsdeveloper/2025/05/19/advancing-windows-for-ai-development-new-platform-capabilities-and-tools-introduced-at-build-2025/ . Opened Windows MCP section: native Windows 11 support announcement, with a private developer preview for selected partners planned in coming months.
- **Discovery only:** TechCrunch https://techcrunch.com/2025/03/26/openai-adopts-rival-anthropics-standard-for-connecting-ai-models-to-data/ and Foray https://www.foray-consulting.com/thought/a-brief-history-of-mcp supplied links to the original X posts. Primary X oEmbed evidence supersedes those pages for dates/content. Do not rely on Foray's broader historical claims, or on a spurious search result that confused MCP with a cryptocurrency protocol. GitHub's official April 4 changelog also surfaced earlier VS Code MCP support, but S21g alone establishes the necessary correction. No secondary technical claim is needed in the final report.

### A1 findings — status: confirmed

- **OpenAI function calling: June 13, 2023.** The Chat Completions API added this capability for `gpt-4-0613` and `gpt-3.5-turbo-0613`. Developers describe functions; the model can emit a JSON object containing function arguments. The historical parameter names were `functions` and `function_call` (S18a). This is an API feature milestone, not the invention of all tool-using language models.
- **Anthropic tool use GA: May 30, 2024.** At that announcement it covered Claude 3 models on the Anthropic Messages API, Amazon Bedrock and Google Cloud Vertex AI (S18b). Earlier beta availability and later models are separate milestones.
- **Toolformer: February 9, 2023 first arXiv submission**, led by Timo Schick et al., Meta AI Research with the additional UPF affiliation noted above (S18c). It trains when/which API calls and arguments to generate and how to use their results through a self-supervised procedure with a small number of demonstrations per API. “No demonstrations at all” would be inaccurate. The requested “Meta AI, February 2023” is a fair concise attribution/date.

### A2 findings — status: confirmed

ReAct was first submitted to arXiv **October 6, 2022**, and published at **ICLR 2023** (S19a). It interleaves generated reasoning traces with task-specific actions, then uses observations from the external environment to inform subsequent steps. The four requested evaluations are correct: **HotpotQA** (question answering), **FEVER** (fact verification), **ALFWorld** and **WebShop** (interactive decision-making). The paper/project provide the evidence directly (S19a/S19b).

For an introductory loop, “推論 → 行動 → 観察 → 次の推論” is a defensible schematic. It should not imply that all modern agents expose private reasoning text or that every action in every ReAct task has a mandatory preceding thought: the authors describe sparse reasoning traces for some decision-making trajectories (S19b). No need to add a universal superiority claim.

### A3 findings — status: confirmed

**SWE-bench: 2,294 tasks drawn from real GitHub issues and corresponding pull requests across 12 Python repositories; first arXiv submission October 10, 2023; ICLR 2024** (S20a). The input is a repository and issue description; the model edits code to address the issue. Keep the original benchmark count distinct from its subsets and other later benchmark variants.

**SWE-bench Verified: August 13, 2024, 500 human-validated tasks**, released by OpenAI with the SWE-bench authors (S20b). It is a filtered subset of the original test set, with human review aimed at removing problematic tasks; “Verified” does not logically guarantee that no ambiguity, flawed test, or contamination can ever remain.

**Deferred derived question:** suitability of SWE-bench Verified for present-day model comparisons. A newer official OpenAI article appeared during discovery (https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/), but this task's A3 asks the historical introduction/count, not a current leaderboard or benchmark recommendation. If the deck later uses contemporary scores as evidence of general software-engineering competence, that separate benchmark-validity review should be performed first; this unit does not claim to have read or established the newer article's findings.

### A4 findings — status: corrected for milestone scope; original announcement and quotation confirmed

Anthropic announced and open-sourced **MCP on November 25, 2024** (S21a). Its official docs contain this exact sentence (12 words, within the quotation budget):

> Think of MCP like a USB-C port for AI applications.

Thus the requested fragment **“a USB-C port for AI applications”** is exact (S21b). The analogy concerns a standardized connection interface between AI applications and external systems; it is not a claim of physical hardware compatibility or guaranteed agent autonomy.

| Company/product milestone | Verified date | What the evidence establishes |
|---|---|---|
| OpenAI adoption announcement | **2025-03-26** | Altman's post says support is available that day in the **Agents SDK**, with **ChatGPT desktop and Responses API forthcoming** (S21c). Do not claim all those products shipped MCP that day. |
| OpenAI Responses API remote MCP | **2025-05-21** | Separate official product launch of remote MCP server support (S21d). |
| Google/Gemini support commitment | **2025-04-09** | Hassabis announced future support for Gemini models and SDK; the post is an endorsement/commitment, not proof of immediate universal availability (S21e). |
| Gemini native SDK support | **2025-05-20** | Google I/O official article says native SDK support for MCP definitions was added in the Gemini API (S21f). |
| Microsoft Copilot Studio initial release | **2025-03-19** | Official first-release announcement, initially in preview regions; broad “Microsoft adopted in May” wording misses this earlier milestone (S21g). |
| Native Windows 11 MCP announcement | **2025-05-19** | Build announcement; private preview with selected partners planned for later, not Windows-wide GA that day (S21h). |

Recommended concise treatment: retain OpenAI **3/26** and Google **4/9** as **対応表明**, label Microsoft's **5/19** specifically **Windowsへのネイティブ対応を発表**, and add **Copilot Studioは3/19に初期対応を発表** if the timeline claims to track earliest corporate adoption. “Microsoft May 2025” is not wrong as a Build milestone but is wrong/underspecified as the company's first MCP support.

### Unresolved points, methods, and next unit

- No substantive uncertainty remains for requested A1–A4 dates, counts, named tasks, or exact USB-C phrase after the product-specific corrections. The X post dates were read from X's official embedding endpoint, so failed direct browser access does not leave those dates based only on reporting.
- No exhaustive earliest-integration history for every Microsoft/Google/OpenAI product was attempted. This is unnecessary to disprove the broad Microsoft May-first claim or to establish the requested dated milestones.
- Network fetches were read-only and bounded (two concurrent requests maximum; 20-second timeouts; 3 MB HTML and 100 KB oEmbed caps). No software was installed, model loaded, inference run, external account changed, or project file edited. Only this log was appended; report remains absent.
- Next unit: **Unit 9, A5** — METR's original 2025 paper, released horizon data, later official measurements and recent doubling-time estimates. Distinguish model versions, evaluation versions, confidence intervals and dates.
- Remaining research units: **9–11**. The attendant's token-threshold instruction arrived at the start of this turn. Unit 8 is now complete and durable; request checkpoint/compaction before Unit 9. Do not draft the report until the explicit report turn after the ready-to-report boundary.

## Plan revision 9

Unit 9 shows that **“METR's number” is versioned**: the March 2025 paper, later TH1.0 updates, January 2026 TH1.1 release, and March 2026 regularization correction give different values. The original paper itself also has a few differences between rounded figure labels and appendix calculations. Derived question: which value belongs to which publication/evaluation snapshot? **Pursue within Unit 9**, because mixing these would defeat the requested original-versus-current comparison. The original A5 question remains the real question; it now needs a versioned answer rather than a single unqualified chart.

The dashboard says it is no longer actively updated as of September 8, 2026. Thus “up to now” means latest official published measurements found through the October 9 research cutoff, not measurements of every currently available model. Later MirrorCode-Early results are considered briefly as a **different task distribution**, and the July 2026 expenditure-horizon work is checked to establish that it is a **different metric**, not a newer entry on the same chart. A comprehensive comparison of AI-work/productivity metrics is **deferred**, as it is larger than the requested fact-check. No new research unit is needed. Remaining after Unit 9: **10–11**, then separate report phase.

## Unit 9: A5 — METR original time horizons, later official measurements, and recent doubling times

Completed: 2026-10-09 UTC. Every URL below retrieved 2026-10-09; clock at unit start read 17:21:45 UTC. Unit complete; no report drafted.

### Sources consulted

- **S22a** Kwa et al., original arXiv **v1**, *Measuring AI Ability to Complete Long Tasks*: https://arxiv.org/html/2503.14499v1 ; bibliographic history https://arxiv.org/abs/2503.14499 . First submitted **2025-03-18 17:59:31 UTC**. Read §§3.3, 4, 6.1, Appendix D.2/D.3 and Table 9. The current v4, July 10, 2026, has title *Measuring AI Ability to Complete Long Software Tasks* and NeurIPS 2025 reference; use the explicit v1 URL for March claims.
- **S22b** Original v1 figure images, fetched and **visually inspected** without saving files: Figure 1 https://arxiv.org/html/2503.14499v1/plots_non_github/headline-green.png ; Figure 5 https://arxiv.org/html/2503.14499v1/plots/individual_histograms/default/histograms.png ; Figure 19 https://arxiv.org/html/2503.14499v1/plots/logistic/double_line_2024_trendline.png . Figure 5 explicitly prints all requested model time horizons; Figure 19 explicitly prints 212-day and 118-day fits.
- **S22c** METR announcement, **2025-03-19**: https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/ . Read original narrative and current versioned graph labels. This page now embeds TH1.1, so its live graph must not be treated as the untouched March 2025 original. Current title also includes “Software.”
- **S22d** METR live/final dashboard: https://metr.org/time-horizons/ . Read definition, methodology, FAQ, and Updates. **Last updated September 8, 2026**, explicitly **no longer actively updated**. Latest added model is **Claude Mythos Preview (early), May 8, 2026**. Updates provide publication/addition dates for several newer measurements, distinct from model release dates.
- **S22e** Official machine-readable TH1.0 snapshot: https://metr.org/assets/benchmark_results_1_0.yaml . Web parser did not handle YAML; fetched by bounded read-only HTTPS and parsed with existing Python YAML library. 14,328 bytes; SHA-256 `f15fd2f13cd8d28f06f5430fabf21dcd1284193ec152bdedc34e11dcc525df66`. Values retrieved are **current corrected TH1.0**, not necessarily the original March 2025 values.
- **S22f** Official machine-readable TH1.1 snapshot: https://metr.org/assets/benchmark_results_1_1.yaml . Read directly as above. 16,255 bytes; SHA-256 `aae31902b0519a4da73e16643915e5e8aca13cd3315c3aac893ce3d6dfe92ad9`. Contains a hybrid series: pre-2023 points retain `METR-Horizon-v1.0`; later points identify `METR-Horizon-v1.1`. Values are **minutes**, corroborated by chart code division by 60 to obtain hours: https://metr.org/assets/js/time-horizon-chart.js . Record `release_date` is the chart's model date, NOT date METR measured or published the result.
- **S22g** METR, *Time Horizon 1.1*, **2026-01-29**: https://metr.org/blog/2026-1-29-time-horizon-1-1/ . Read main text and appendices. 170→228 tasks, 14→31 tasks of 8h+, Vivaria→Inspect; only 5 of the 31 long tasks had measured human baselines, remaining times were estimates. Article preserves January estimates/trends that differ from corrected current YAML.
- **S22h** Alexander Barry, METR research note, *Impact of modeling assumptions on time horizon results*, **2026-03-20**: https://metr.org/notes/2026-03-20-impact-of-modelling-assumptions-on-time-horizon-results/ . Read summary, regularization explanation and task-distribution discussion. Records correction on **2026-03-03**; recent p50 values fell by up to 20%. Explicitly a less-reviewed research note, not necessarily the organization's collective view. Dashboard S22d independently confirms correction date.
- **S22i** METR, *Details about METR's evaluation of OpenAI GPT-5*, **2025-08-07**: https://metr.org/evaluations/gpt-5-report/ . Read summary and time-horizon sections. “GPT-5” here means **gpt-5-thinking**; reported approximately **2h17m** at that time.
- **S22j** METR, *Frontier Risk Report (February to March 2026)*, **2026-05-19**: https://metr.org/blog/2026-05-19-frontier-risk-report/ . Read summary and Appendix E time-horizon, messiness and MirrorCode-Early sections. Provides later **105-day** post-2024 public-frontier fit, saturation cautions, and separate MirrorCode-Early findings.
- **S22k** METR, *Expenditure Horizon: Measuring Optimization Ability, with an Application to NanoGPT*, **2026-07-21**: https://metr.org/blog/2026-07-21-expenditure-horizon/ . Read definition and relation-to-time-horizon section. This is a cost/performance metric in dollars, not a new p50 task-length measurement, even though it evaluates newer models.
- **Historical data audit, not required for the final numbers:** official analysis repo https://github.com/METR/eval-analysis-public . GitHub API found March 19 snapshot `2cd6540cb56bd3bf33fff1afcb78a4251352a4bc`; read `.dvc/config`, `dvc.lock`, `example_analysis.ipynb` and tree via official GitHub API/raw URLs. The lock records historical headline CSV as 2,501 bytes, MD5 `092c493bac53a379a9d1b924f9abe699`, but underlying DVC objects are in an S3 bucket that returned HTTP 403 to unauthenticated reads. **Do not claim historical raw CSV was read.** The original figure labels and article tables fully establish the requested display values without it.
- Discovery surfaced third-party dashboards and commentary with obsolete values (e.g. Opus 4.6 14.5h) and proxy copies. They were not used as numerical evidence. Direct official originals were available.

### A5 findings — status: confirmed for original claim; later values require version/date qualifiers

**Definition:** the p50 horizon is the human-expert task duration at which a fitted success curve predicts 50% success for an AI agent on the evaluated task distribution. It is not how long the model runs, not a guaranteed continuous autonomous working time, and not the claim that half of all real-world jobs of that length can be automated. The task suite primarily covers self-contained, well-specified software/ML/cybersecurity tasks and measures model-plus-scaffold performance (S22a/S22d). Human baseliners generally have low task-specific context; their successful completion times are aggregated, with estimates used for some tasks.

The March paper reports **212 days, 95% bootstrap CI 171–249 days**, approximately **7 months**, over **2019–early 2025** (S22a §4.2). Thus the user's seven-month summary is correct as a historical finding. This is an empirical fitted trend, not a guaranteed future law.

#### Original March 2025 paper values (Figure 5)

These are the **labels printed in the original figure**, read visually (S22b). Use approximate signs and avoid implying more precision than the display. Model dates below follow the original paper/chart chronology and S22e/f metadata; see proxy caveat below.

| Requested model | Model date used on METR chart | Original Figure 5 p50 label | Qualification |
|---|---|---|---|
| GPT-2 | 2019-02-14 | **2 seconds** | Very short SWAA tasks; the main headline dot is around 2–3s, so “約2秒” is the figure's display value, not an exact raw measurement. |
| GPT-3 | 2020-05-28 | **9 seconds** | Actually evaluated `davinci-002` as a proxy. |
| GPT-3.5 | 2022-03-15 | **36 seconds** | Actually evaluated `gpt-3.5-turbo-instruct` as a proxy; not a claim that this endpoint launched in March 2022. |
| GPT-4 0314 | 2023-03-14 | **5 minutes** | GPT-4 1106 has a separate figure label of **8 minutes**; do not silently substitute it. |
| Claude 3.5 Sonnet (Old) | 2024-06-20 | **18 minutes** | First 3.5 Sonnet. |
| Claude 3.5 Sonnet (New) | 2024-10-22 | **28 minutes** | Revised 3.5 Sonnet. Include both because the unsuffixed name is ambiguous. |
| o1 | 2024-12-05 | **39 minutes** | o1-preview is separate (**22 minutes** in figure). |
| Claude 3.7 Sonnet | 2025-02-24 | **59 minutes** | Confirmed in §4.2.1 prose as well as Figure 5. Abstract's “around 50 minutes” is coarser wording, not evidence against 59. |

**Internal original-paper precision caveat:** Appendix D starts by warning that some ablations used a slightly different pipeline version. Its Table 9 gives **18.22 min**, **28.98 min**, **39.21 min** and **8.56 min** for old/new Sonnet 3.5, o1 and GPT-4 1106 respectively. These are valid appendix values, but should not be presented as more precise raw equivalents of every Figure 5 label. Prefer Figure 5's explicitly printed approximate values for a March-paper timeline.

**Model proxy caveat:** §4.2 footnote explicitly says original GPT-3 and GPT-3.5 variants were no longer available, so closest available models were evaluated but assigned the older model family's release dates. GPT-2 could not use the long-task scaffold; long-task scores were imputed zero, while actual short-task data supplied its useful range. This limits overly literal interpretations of “2019 model tested in 2019,” which the study does not claim.

#### Later official measurements: versioned comparison

The following table records all post-paper model entries found in current official TH1.0/TH1.1 files, with **model date** from the data and **p50 in minutes, [95% CI]**. Dashes mean that series does not include the model. These are October 9 retrieval snapshots **after corrections**, not values originally announced on model-release day. This table is deliberately version-separated: do not form a mixed-series ranking or growth curve without identifying the methodological change.

| Model | Model date | Current TH1.0 p50 min [CI] | Current TH1.1 p50 min [CI] |
|---|---|---|---|
| DeepSeek V3 0324 | 2025-03-24 | 24.59 [12.57, 43.33] | — |
| o3 | 2025-04-16 | 91.44 [46.57, 158.04] | 119.73 [74.62, 190.94] |
| o4-mini | 2025-04-16 | 76.75 [37.05, 142.12] | — |
| Claude Opus 4 | 2025-05-22 | 83.57 [44.93, 140.62] | 100.37 [59.99, 163.45] |
| Claude Sonnet 4 | 2025-05-22 | 73.66 [38.32, 127.09] | — |
| DeepSeek R1 0528 | 2025-05-28 | 32.76 [13.76, 64.08] | — |
| Gemini 2.5 Pro Preview | 2025-06-05 | 40.18 [20.36, 69.86] | — |
| Grok 4 | 2025-07-09 | 104.85 [47.56, 208.30] | — |
| Claude Opus 4.1 | 2025-08-05 | 109.26 [55.95, 200.81] | 100.47 [59.27, 159.45] |
| gpt-oss-120b | 2025-08-05 | 45.11 [19.90, 85.54] | — |
| GPT-5 | 2025-08-07 | 130.82 [67.70, 247.82] | 203.01 [112.64, 405.55] |
| Claude Sonnet 4.5 | 2025-09-29 | 116.53 [58.94, 225.75] | — |
| Kimi K2 Thinking | 2025-11-06 | 57.62 [27.42, 100.59] | — |
| Gemini 3 Pro | 2025-11-18 | — | 224.33 [139.57, 379.24] |
| GPT-5.1-Codex-Max | 2025-11-19 | 162.25 [80.19, 336.50] | 223.71 [134.31, 396.21] |
| Claude Opus 4.5 | 2025-11-24 | 246.78 [104.27, 821.56] | 292.99 [161.72, 623.70] |
| GPT-5.2 | 2025-12-11 | — | 352.25 [198.07, 815.18] |
| Claude Opus 4.6 | 2026-02-05 | — | 718.81 [316.69, 3633.79] |
| GPT-5.3-Codex | 2026-02-05 | — | 349.53 [194.91, 816.35] |
| Gemini 3.1 Pro | 2026-02-19 | — | 384.15 [233.50, 694.75] |
| GPT-5.4 | 2026-03-05 | — | 341.74 [186.58, 768.78] |
| Claude Mythos Preview (early) | 2026-04-07 | — | 1044.78 [508.88, 3304.26] — **above reliable measurement range** |

Particularly useful latest-series conversions, calculated from S22f: GPT-5 **3h23m**; Opus 4 **1h40m**, Opus 4.1 **1h40m**, Opus 4.5 **4h53m**, Opus 4.6 **11h59m**. Mythos Preview (early) has a numerical point estimate **17h25m**, but METR explicitly warns **measurements above 16 hours are unreliable with this suite**. Do not headline 17h25m as a precise settled capability. The word “early” is part of the evaluated model label.

**Publication and revision chronology:**

- **2025-08-07:** GPT-5 evaluation report originally described **2h17m** (S22i). This historical number remains valid when attributed to that report; it is not the current TH1.1 estimate.
- **2025-12-19:** dashboard added Opus 4.5 (S22d).
- **2026-01-29:** TH1.1 release (S22g). At that time it reported GPT-5 **214 min [117,480]**, Opus 4 **101 [58,170]**, Opus 4.5 **320 [170,729]**, and Sonnet 3.7 **60 [32,106]**. The January article still contains these numbers; do not call them today's corrected snapshot.
- **2026-02-03:** added Gemini 3 Pro and GPT-5.1-Codex-Max to newer series; **Feb 4** GPT-5.2; **Feb 20** Opus 4.6 and GPT-5.3-Codex (S22d). The update log also lists a November 19 addition for GPT-5.1-Codex-Max under the old series; these are separate historical updates.
- **2026-03-03:** corrected unintended regularization, affecting values in both series (S22d/S22h). Regularization had flattened fitted curves, tending to increase strong models' p50 and decrease weak ones' p50; some widely copied historical numbers are consequently stale.
- **2026-04-10:** added GPT-5.4; **April 15** Gemini 3.1 Pro; **May 8** Mythos Preview (early) and >16h warning; **September 8** notice that page is no longer actively updated (S22d).
- Earliest publication dates for every 2025 model and later TH1.1 reevaluations such as Opus 4.1 were not all established. The table dates are explicitly **model dates**; never recast them as measurement dates. Official dashboard values as retrieved are established independently of that historical gap.

#### Does METR report a faster recent doubling time? Yes, but specify the fit and vintage

| Dated evidence | Data period / series | Reported doubling time |
|---|---|---|
| March 2025 original paper §4.2 / Fig. 19 | 2019–early 2025 | **212 days**, 95% CI **171–249**, about 7 months |
| March 2025 original Fig. 19 | Models from **2024-01-01 onward** | **118 days**, about 3.9 months; short-period trend, paper asks for future significance/change-point analysis |
| January 29, 2026 TH1.1 release appendix | Entire hybrid history | **196.5 days**; pre-2023 TH1 values stitched to TH1.1 |
| Same January release | Since 2023, TH1 vs TH1.1 | **165.3 [129,211]** vs **130.8 [107,161] days** |
| Same January release | Since 2024, TH1 vs TH1.1 | **108.9** vs **88.6 days** |
| May 19, 2026 Frontier Risk Report, App. E | Public-frontier fit from **2024-01-01 onward**, report's data | **105 days**, R² 0.98 |
| Current YAML, retrieved Oct. 9 | TH1.0 all-time / since 2023 | **201.150 [176.208,225.353] / 175.603 [138.411,229.176] days** |
| Current YAML, retrieved Oct. 9 | TH1.1 hybrid all-time / since 2023 | **187.778 / 128.744 [104.428,158.012] days** |

The latest YAML does **not** expose a post-2024 doubling estimate, so do not label January's 88.6 days as the current dataset's fit. Recent acceleration is supported as a **reported fitted pattern**, while task composition, model coverage, measurement corrections, wide intervals, and chosen starting date influence its magnitude. No fresh regressions or forecasts were calculated for this fact-check.

#### Other later METR measurements: keep distinct

S22j reports **MirrorCode-Early**, a separate software reimplementation suite: Opus 4.6, Gemini 3.1 Pro and GPT-5.4 all had p50 horizons **over 32h**, with Opus 4.6 **over 100h**. That does not contradict TH1.1's ~12h Opus 4.6 result: the tasks and token budgets differ (100M tokens per run generally, 400M for Opus 4.6, 10M for GPT-4o). Treat this only as a separate later measurement, with early-version and saturation limitations, not another point on the original TH1 curve. The report says the trend seems similar or faster, based on limited data.

S22k's July **expenditure horizon** is expressed in **dollars**, at the human-versus-agent cost/performance crossing, and does not supply replacement p50 task-hour measurements for Opus 4.7/4.8 or GPT-5.5. A broad comparison of those metrics is deferred. The official dashboard's final public entries do not establish October 2026 capabilities of unevaluated newer models.

### Unresolved points, methods, and next unit

- Main A5 claims and requested original figures are resolved. The report should mark the original claim **confirmed**, with explicit version corrections for later numbers, rather than treating every differing official number as an error.
- Limitations left explicit: historical raw CSV inaccessible (original figure/table evidence is sufficient); some original figure labels and appendix calculations use different pipelines; exact first-publication dates not found for every later model; task-distribution/real-world validity and broad uncertainty of long horizons; dashboard no longer maintained. No model-specific upper bound should be inferred solely from absence on it.
- Searches included official later research through the cutoff; July expenditure-horizon work and September dashboard retirement were identified. No later same-series measurement than the May 8 addition was found. This is not proof METR published no other evaluation in any domain.
- Read-only HTTP/GitHub access only, 15–20s timeouts, byte caps (typically 100KB–2MB; one figure 3MB). Existing YAML parser used without installing dependencies; small image payloads displayed in memory. No evaluation/model execution, project edits, downloaded files or report draft.
- Next unit: **Unit 10, A6–A7** — Anthropic's multi-agent research result/token cost and Anthropic/OpenAI computer-use launch claims.
- Remaining research units: **10–11**. The attendant's token-threshold warning arrived at turn start; Unit 9 is now complete and durable. Request checkpoint/compaction before Unit 10. Report remains reserved for the explicit report turn after ready-to-report.

## Plan revision 10

Unit 10 confirms the dates and numerical claims but exposes an important denominator distinction: the 90.2% performance comparison is against single-agent Opus 4, whereas the 15× token comparison is against chats. Derived question: do these two numbers establish a controlled performance/cost trade-off for multi-agent systems generally? **Resolve narrowly now**: the public article supports a vendor-reported internal result and observed token-use ratio, not that broader inference. A controlled reproduction or general survey of multi-agent effectiveness is **deferred** because it exceeds the requested fact-check. The original question is unchanged. Remaining research unit: **11, final coverage and unresolved-point audit**; report remains a separate phase.

## Unit 10: A6–A7 — multi-agent research result and computer-use launch dates

Completed: 2026-10-09 UTC. All sources retrieved 2026-10-09; clock read 17:28:13 UTC near unit start. Unit complete; no report drafted.

### Sources consulted

- **S23** Anthropic, *How we built our multi-agent research system*, **June 13, 2025**: https://www.anthropic.com/engineering/multi-agent-research-system . Read publication date, Benefits, Architecture, and Evaluation sections in the official page.
- **S24a** Anthropic, *Introducing computer use, a new Claude 3.5 Sonnet, and Claude 3.5 Haiku*, **October 22, 2024**: https://www.anthropic.com/news/3-5-models-and-computer-use . Read announcement, availability, and mechanism. Later Haiku price update is separately labeled and does not change the original date.
- **S24b** OpenAI, *Introducing Operator*, **January 23, 2025**: https://openai.com/index/introducing-operator/ . Read date, launch availability, browser/CUA description, API future plans, and the separately labeled July 17 update. Historical official announcements remain appropriate under the previously applied OpenAI Docs skill and the user's explicit source request.

### A6 findings — status: confirmed, with attribution and denominator qualifiers

S23 reports that **Opus 4 lead + Sonnet 4 subagents** outperformed **single-agent Opus 4 by 90.2%** on Anthropic's internal research evaluation. State this as the company's reported evaluation result, not an independently reproduced universal improvement, a 90.2% success rate, or an increase of 90.2 percentage points. The page does not give sufficient raw scores, uncertainty, and matched-budget experiment details to establish those stronger interpretations.

S23 separately reports agents using approximately **4×** chat tokens and multi-agent systems approximately **15×** chat tokens in its data. Therefore **15× is relative to chats**, not relative to the single-agent Opus 4 baseline. Token use is not automatically a monetary cost ratio when model mix and pricing differ. The article emphasizes research with parallel independent directions and limits on suitability for interdependent work.

Suggested concise factual wording: **2025年6月13日、AnthropicはOpus 4を主担当、Sonnet 4を子エージェントとする構成が、社内の研究評価で単独のOpus 4を90.2%上回ったと報告。マルチエージェントのトークン使用量は、同社の観測ではチャットの約15倍。**

### A7 findings — status: confirmed, with launch-stage qualifiers

S24a confirms **October 22, 2024**, public beta of computer use with the **upgraded Claude 3.5 Sonnet**. Developer access was offered through Anthropic API, Amazon Bedrock, and Google Cloud Vertex AI. It describes screen perception, cursor movement, clicks and typing; it was experimental. Do not imply a completed general-purpose consumer desktop assistant or attribute this launch to the June 2024 Sonnet version.

S24b confirms **January 23, 2025**, **Operator research preview**, initially for **ChatGPT Pro users in the United States**. Operator used its own browser and the Computer-Using Agent (CUA) model to interact with graphical web interfaces. API exposure was a future plan in that announcement, not the January launch itself. The page's **July 17, 2025** update records integration into ChatGPT agent; that later product change does not alter the original launch date. Its present navigation points to newer products and should not be mistaken for January availability.

Suggested timeline labels: **2024-10-22 — Claude 3.5 Sonnetのcomputer useをAPIで公開ベータ開始**; **2025-01-23 — OpenAI Operatorを米国のPro利用者向け研究プレビューとして公開**.

### Unresolved points, methods, and next unit

- A6's raw internal evaluation data and exact metric computation are not established by the public article. This limits causal/general claims but does not prevent confirming what Anthropic reported. No benchmark execution or paid service access is necessary.
- A7 dates and launch scope are resolved by direct official announcements. A full history of subsequent computer-use products and present availability is outside this historical claim and deferred unless the deck expands its scope.
- Read-only native web retrieval only. No installations, model runs, project edits, or additional artifacts. Original user claims were checked against the supplied A6–A7 wording.
- Next unit: **Unit 11**, audit all 24 IDs, exact quotation presentation, current/GA figures, and open issues against the original request. Read earlier log sections in bounded ranges to avoid truncation. Original request is fully represented by H1–H7/C1–C7/T1–T3/A1–A7; investigate only remaining substantive gaps, then append the complete audit and return the **ready-to-report** boundary. Do not write the report during that audit turn.
- The attendant's threshold warning arrived at this turn's start. Unit 10 is now complete and durable; request checkpoint/compaction before Unit 11. After Unit 11, report creation still requires an explicit report turn.

## Plan revision 11

The final audit found an additional **provider-limit ambiguity in C6**: AWS's active model card and quota catalog document Scout's 10M configuration, but an AWS January 2026 article says Bedrock supports up to 3.5M. The derived question is whether the nominal model window establishes a universally usable hosted API limit. **Pursue narrowly within Unit 11** by comparing these official documents; preserve the discrepancy as uncertainty rather than choosing an undocumented explanation. Provider/account entitlement testing remains deferred. This strengthens, rather than changes, Unit 5's distinction between publicly released weights and API availability. No further research unit is needed to answer the original fact-check with explicit limits. Remaining work: finish Unit 11, then the separate attendant-designated report phase (Unit 12).

## Unit 11: Final 24-item coverage, quotation, availability, and measurement-version audit

Completed: 2026-10-09 UTC. Clock near the fresh source check read **17:30:16 UTC**. Retrieval/review date for sources below: **2026-10-09**. Unit complete. No report drafted.

### Sources consulted

- Re-read the original supplied question and all item IDs; reviewed `research/llm-facts/log.md` Units 1–10, with bounded section reads after one initial full-file tool response truncated. This is a synthesis/audit of the original sources already individually documented above, not new independent corroboration. A small read-only script found exactly **24** individual findings headings, no missing IDs, and no duplicates. The output directory contained only `log.md` before this append.
- **S25a** AWS, Sebastian Bustillo, *Using Strands Agents to create a multi-agent solution with Meta’s Llama 4 and Amazon Bedrock*, **2026-01-21**: https://aws.amazon.com/blogs/machine-learning/using-strands-agents-to-create-a-multi-agent-solution-with-metas-llama-4-and-amazon-bedrock/ . Opened the dated article and the table under the context-window discussion. The table gives Scout **10M**, with **up to 3.5M using Amazon Bedrock**.
- **S14b rechecked** AWS active Scout model card: https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-meta-llama-4-scout-17b-instruct.html . Still identifies lifecycle **Active** and context **10M**. AWS quota catalog: https://docs.aws.amazon.com/general/latest/gr/bedrock.html . Still has separate **10M** and **128K** Scout provisioned-throughput entries, 10M default quota **0**, adjustable. These are real documentation entries, but do not by themselves demonstrate an account's successful 10M request.
- **S25b** Meta's current Llama get-started documentation: https://ai.meta.com/llama/get-started/ . Read the returned official text: Scout is listed with **10M** and model-download paths through Meta/partners. This corroborates Unit 5's public-model definition, independently of AWS's hosted-limit ambiguity.
- **S22d rechecked** METR dashboard: https://metr.org/time-horizons/ . Reopened definition, limitations and update list. It still says no longer actively updated, last updated **2026-09-08**, and measurements above **16h** unreliable. Latest listed model addition remains Mythos Preview (early), **2026-05-08**. The FAQ retains a historical GPT-5 **2h17m** example; this is not a reason to overwrite the corrected TH1.1 machine-readable value in Unit 9.
- Fresh discovery searches covered larger public context windows (20M/100M), Magic's official model availability, and AWS's Scout documentation. Magic search again surfaced its 2024 research announcement, https://magic.dev/blog/100m-token-context-windows , not a verified 100M general release. No larger publicly released general-purpose model was established. Aggregators, Reddit and search-only third-party API profiles were not used as technical evidence.

### Audit decisions by item

The table below is a completion map for report production. Detailed evidence and exact strings remain in the cited units. Status is an editorial assessment of the supplied item: **corrected** includes a necessary scope or typography correction; **confirmed** still requires the stated attribution/limits. Residual uncertainties must remain visible even when most of an item is confirmed.

| ID | Final status | Coverage and essential qualification | Evidence location |
|---|---|---|---|
| H1 | corrected | All five labels/strings checked; original zero-order has X where reprint has H; no terminal periods on these original samples. Preserve edition distinction and print-line normalization. | Unit 1, S1a/S1b |
| H2 | corrected | Original opening typography vs normalized display; single curved quotation marks, small capitals, no extra final period. Original imitation-game setup differs from simplified later retellings. | Unit 1, S2a–d |
| H3 | confirmed | Eight conversation lines checked; DOCTOR is a script; secretary anecdote is Weizenbaum's 1976 retrospective, not the 1966 article. | Unit 1, S3a/S3b |
| H4 | corrected | All dates, eight authors, institutional footnotes, eight P100s and 3.5 days checked. Attention replaces recurrence/convolution for sequence dependencies, but feed-forward layers and other components remain. | Unit 2, S4a |
| H5 | confirmed | GPT expansion/counts/dates; GPT-2 staged release; GPT-3 processed 300B tokens; exact few-shot panel preserves `plush girafe`. | Unit 2, S5a–h |
| H6 | confirmed | Five-day million is attributed company statement; January 100M is estimated MAU; Reuters/UBS/Similarweb and Sensor Tower have different roles; fastest growth is a contemporaneous assessment. | Unit 3, S7a–c |
| H7 | corrected | Every listed calendar date covered; distinguish paper, announcement, preview and GA, especially BERT, o1, Claude Code and Codex cloud. | Unit 3, S8a–l, S6a/c |
| C1 | confirmed | Correct model/encoding mappings and rounded counts; exact defined-token count differs from highest-ID-plus-one. GPT-2 is 50,257. | Unit 4, S9a–d |
| C2 | confirmed | Formula and closest-vector meaning checked; January word2vec paper explicitly attributes prior result to Mikolov/Yih/Zweig RNN-embedding study; normalized math is not a facsimile. | Unit 2, S6a/S6b |
| C3 | confirmed | 175B variant has 96 layers, 12,288 width, 96 heads, 2,048 context. | Unit 2, S5g |
| C4 | confirmed | April 18, 2024 original Llama 3 pretraining, over 15T tokens. | Unit 4, S10a/S10b |
| C5 | confirmed | 70B, 1.4T, about 20:1; training-compute optimum, not universal/lifetime-cost optimum; comparison with 280B Gopher. | Unit 4, S11a/S11b |
| C6 | corrected | Historical values confirmed with preview/access stages. Largest checked publicly released model's nominal window: Scout 10M. Unqualified worldwide or universally available hosted-API maximum remains uncertain; AWS discrepancy below supersedes any stronger inference from Unit 5. | Unit 5, S13a–f/S14a–h; Unit 11, S25a/S25b |
| C7 | confirmed | January 23, 2020; empirical held-out cross-entropy loss scaling in studied non-bottlenecked regimes, not all benchmark scores or “intelligence.” | Unit 4, S12a |
| T1 | confirmed | January 27 blog vs March 4 arXiv; 1.3B preference comparison, three training stages and optional PPO-ptx detail. | Unit 6, S15a/S15b |
| T2 | corrected | March 1, 2023 and original roles confirmed; manual-history statement scoped to Chat Completions/Messages, with current server-managed APIs distinguished. | Unit 6, S16a–f |
| T3 | confirmed | Six fabricated submitted opinions; June 22, 2023, Judge Castel, total jointly/severally owed $5,000; sanction grounds and fabricated Varghese example recorded. | Unit 7, S17a–c |
| A1 | confirmed | June 13, 2023 function calling; May 30, 2024 Anthropic tool-use GA; February 9, 2023 Toolformer submission. | Unit 8, S18a–c |
| A2 | confirmed | October 6, 2022 arXiv / ICLR 2023; reasoning/action/observation concept and all four named environments. | Unit 8, S19a/S19b |
| A3 | confirmed | Original 2,294/12, October 10, 2023 / ICLR 2024; Verified 500, August 13, 2024. Present-day benchmark validity is separate/deferred. | Unit 8, S20a/S20b |
| A4 | corrected | Exact USB-C sentence and November 25, 2024 confirmed; adoption dates distinguish SDK, future commitment, Windows preview and earlier March Copilot Studio release. | Unit 8, S21a–h |
| A5 | confirmed | Original seven-month fit and every requested original model label checked. Later TH1.0/TH1.1 values, correction date, model-vs-publication dates, faster recent fits and separate metrics recorded. | Unit 9, S22a–k |
| A6 | confirmed | Anthropic-reported 90.2% relative improvement vs single Opus 4; approximately 15× tokens vs chats, not the same denominator. | Unit 10, S23 |
| A7 | confirmed | October 22, 2024 upgraded Sonnet public API beta; January 23, 2025 Operator U.S. Pro research preview. | Unit 10, S24a/S24b |

Audit totals: **17 confirmed, 7 corrected, 0 wholly uncertain items**. This does not mean all subclaims are equally certain; notably C6's strict GA/API superlative remains unestablished and must be labeled as such in the report. The final report must still have exactly one main table row per item ID, with supplemental quote/timeline/METR tables where needed for readability.

### C6 final qualification — use this with Unit 5

The original requested “largest generally available context window” has two possible readings. Under the explicit public-release definition, **Llama 4 Scout's 10M nominal window** remains the largest established in the sources checked (Meta's released weights and current documentation). Under the narrower **hosted API actually usable at that size by ordinary accounts** reading, the evidence does **not** settle a unique worldwide maximum. AWS's current card/catalog corroborate a documented 10M configuration, while the dated engineering article states 3.5M on Bedrock. Different serving paths, later changes, or documentation imprecision could explain this, but none was demonstrated. Do not select one explanation as fact or say every Bedrock request supports 10M. Report the discrepancy and defer account/region/contract verification if an operational recommendation is later needed. No account access, inference or model load is needed for this fact-check.

### Cross-item consistency and report requirements

- All exact supplied passages are accounted for: Shannon (five strings), Turing opening, ELIZA (eight turns), GPT-3 translation panel, word-vector expression, MCP analogy. Reproduce supplied quotations with the established corrections; explicitly label normalized typographic spacing/apostrophes and source editions. Do not silently correct `girafe` or add punctuation.
- Preserve dates' event types. In particular, paper submission is not code/model release, preview is not GA, and model release date is not METR evaluation publication date.
- Keep METR's original March Figure 5 separate from later corrected TH1.0 and TH1.1. Explain p50 as human task duration under an evaluation distribution, not autonomous wall-clock runtime. Do not use the >16h point as a precise headline or mix MirrorCode-Early/expenditure horizon into the original curve.
- The research clock consistently placed this work on **2026-10-09 UTC**, despite the environment's next-day date label. Use **2026-10-09** as the source-retrieval cutoff. Later report-writing time must not falsely move the evidence cutoff forward.
- Report uncertainties include inaccessible original Altman/UBS rendering (contemporary sourced reporting used), BERT exact repository release day (paper date established), C6 GA/API ambiguity, original METR raw CSV access/version differences/coverage and long-task uncertainty, and Anthropic internal-evaluation reproducibility. These do not require inventing values or blocking completion.
- Plan evolution belongs in the report: edition-sensitive quotations; event-specific dates; vocabulary-count and training-optimum definitions; public-model vs service availability; endpoint-specific state; six submitted opinions vs nested citations; product-specific MCP adoption; versioned METR values; multi-agent denominator distinction. The original research question did not change.
- Deferred derived work: exact BERT first repository/weight-release archaeology if needed, account-specific long-context availability and quality benchmarking, contemporary SWE-bench validity before interpreting new scores, cross-metric productivity/autonomy analysis, controlled multi-agent performance/cost reproduction, and subsequent/current computer-use product history. None is necessary to finish the requested dated fact-check.

### Completion and next phase

All research units **1–11 are complete relative to Plan revision 11**. The log is now the durable evidence record. No project files were changed; no installations, GPU/model workloads, paid API calls, or external writes were performed. The only written artifact remains this append-only log.

**Next unit: Unit 12, report phase.** The next attendant turn must explicitly be the report turn. Reread this log, write `research/llm-facts/report.md` in Japanese with a summary, exactly 24 main fact-check rows (ID/status/correct value or wording/source URLs/short note), supporting exact quotations and dated tables, uncertainties, plan evolution and next actions. Use direct source links near claims. Keep `log.md` append-only. Do not write the report in this audit turn.

**Boundary: ready-to-report — ready to write report.** The threshold warning has been honored by finishing and logging Unit 11. Request checkpoint/compaction now, before the separate report turn.

## Unit 12: Final report — Japanese fact-check, evidence tables, and completion

Completed: **2026-10-09 17:40:02 UTC** (clock read during final verification). This is the explicitly designated report turn. Source-retrieval cutoff remains **2026-10-09 UTC**; no new web evidence was fetched during report production.

### Sources consulted

- `research/llm-facts/log.md`, Units 1–11 and Plan revisions 1–11, reread 2026-10-09 in bounded sections after an initial full read truncated. All external source URLs and retrieval dates remain documented in those units.
- Original supplied H1–H7, C1–C7, T1–T3, A1–A7 question, reread 2026-10-09 to verify requested coverage, exact quotations, and output scope.
- `research/llm-facts/report.md`, created and checked 2026-10-09. This is a synthesis of the documented primary evidence and qualified reporting, not a new independent source.

### Findings and delivered artifact

- Wrote the final Japanese report to `research/llm-facts/report.md`: summary, exactly 24 main fact-check rows, statuses, corrected wording/values, direct source links, and notes.
- The report records **17 confirmed / 7 corrected** items, retaining uncertainty at the subclaim level, especially the strict hosted-API maximum in C6.
- Included exact/normalized historical quotation supplements, all H7 timeline events, context-window availability stages, endpoint-specific state-management quotations, product-specific MCP adoption, court sanction scope, multi-agent denominators, and historical computer-use launch conditions.
- Included METR's original Figure 5 values, **22 later model rows with separate corrected TH1.0/TH1.1 values and confidence intervals**, release-versus-publication dates, correction chronology, dated doubling-time estimates, and distinct later metrics. The >16h limitation and discontinued dashboard updates remain explicit.
- The report explains how the plan evolved while the original question stayed unchanged, lists unresolved points, preserves deferred derived questions, and recommends concrete deck wording and scoped follow-up research.

### Verification and limitations

- A small read-only structural check confirmed all 24 required IDs occur exactly once in the main table, the expected 17/7 status totals, no unfinished placeholder, and 104 distinct source URLs all present in the research log. One canonical GitHub link was changed to the exact raw URL actually recorded as read; no new evidence was implied.
- Compared all numeric fields in the 22 later METR rows against the log; all matched. The output directory contains exactly `log.md` and `report.md`. The report is 51,285 UTF-8 bytes.
- No project code, deck, engine, dependency, system configuration, external account, or model workload was changed. This report turn only wrote the two authorized research artifacts. No new uncertainty requiring intervention was discovered.

### Next unit and completion

**No research units remain.** Units 1–11 were completed under Plan revision 11; Unit 12 has now delivered the report. Deferred optional investigations remain recommendations, not unfinished required units. The report phase is complete: return `state: done`, `unit: report`, `checkpoint: false`. No further checkpoint or automatic continuation is requested.
