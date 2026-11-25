<div align="center">

# AI & Generative AI Engineering | LLMs, RAG, LangGraph, PyTorch

**Technical & Solutions Architecture · Generative AI · Agentic AI · Machine Learning Engineering**

[Explore all repositories](https://github.com/su394611-del?tab=repositories) · [Browse projects by topic](#project-directory) · [Start here](#getting-started)

</div>

## About this GitHub profile

Live site: **[su394611-del.github.io](https://su394611-del.github.io/)**

Welcome! This GitHub profile brings together **public Python, PyTorch, Hugging Face, LangChain, and LangGraph projects** focused on understanding and implementing modern AI systems.

The repositories include practical examples of **retrieval-augmented generation (RAG)**, **Transformer architectures**, **language-model fine-tuning**, **distributed training**, **parallel inference**, **multi-agent orchestration**, and the **Model Context Protocol (MCP)**.

**Project scope:** These are independent engineering demonstrations. Some contain offline tests or runnable notebooks; check each repository's README for exact implementation status, hardware requirements, validation results, and limitations. No production deployment, benchmark, or enterprise-readiness claim is implied.

## Project directory

| Project | What the repository demonstrates | Key technologies |
| --- | --- | --- |
| **[MedSparse Healthcare](https://github.com/su394611-del/MedSparse-Healthcare-LLM-From-Scratch)** | A 38.8M-parameter sparse Mixture-of-Experts medical language model pretrained from random initialization and fully fine-tuned on medical Q&A, with a held-out evaluation, a [technical report](https://su394611-del.github.io/research/medsparse-healthcare-2026/) (DOI [10.5281/zenodo.24461541](https://doi.org/10.5281/zenodo.24461541)) and released weights. Research model; not for clinical use. | PyTorch, sparse MoE, Hugging Face |
| **[Multi-Tenant RAG Service](https://github.com/su394611-del/RAG-service)** | Tenant-filtered vector retrieval, semantic caching, illustrative PII redaction, basic request safeguards, diagnostics, and a FastAPI interface. Primarily a retrieval/extractive-answering demo. | Python, Qdrant, Sentence Transformers, FastAPI |
| **[LLM Fine-Tuning & Preference Optimization](https://github.com/su394611-del/Pre-training-and-Fine-tuning)** | Qwen LoRA fine-tuning and separate small-model demonstrations of SFT, DPO, and ORPO; notebooks, scripts, and example datasets. | PyTorch, Hugging Face Transformers, PEFT, TRL |
| **[DistilBERT Full vs. Head-Only Fine-Tuning](https://github.com/su394611-del/Full-Fine-Training-Pre-Training-Mid-Training)** | Customer-support message classification and a comparison of full-model fine-tuning with a frozen-encoder classifier head. Despite the repository name, it does **not** demonstrate LLM pretraining or mid-training. | PyTorch, Transformers, DistilBERT, Jupyter |
| **[Multi-Agent Workflows with LangGraph](https://github.com/su394611-del/Multi-agents-using-LangGraph)** | Runnable graph orchestration examples with Python scripts, notebooks, and optional model-backed workflows. | LangGraph, Python, Jupyter |
| **[Parallel LLM Inference](https://github.com/su394611-del/Parallel-LLM-Inference)** | Multiprocessing-based batch inference with independent model replicas, worker queues, JSONL output, and a deterministic offline mock mode. This is **not** tensor parallelism or an HTTP serving API. | PyTorch, Transformers, Qwen, Python multiprocessing |
| **[Distributed Data Parallel LLM Training](https://github.com/su394611-del/Distributed-Data-Parallel-Processing)** | PyTorch DistributedDataParallel using a small causal Transformer, plus a Qwen LoRA training path and CPU demonstrations. | PyTorch DDP, torchrun, PEFT, Qwen |
| **[Transformer Encoder from Scratch](https://github.com/su394611-del/LLM-from-scratch)** | Hand-built attention, positional encoding, encoder layers, and sentiment classification. This is an educational **Transformer encoder**, not a generative LLM trained wholly from scratch. | PyTorch, self-attention, Transformer encoder |
| **[Transformer Training & Alignment Draft](https://github.com/su394611-del/Transformers-Training)** | DistilBERT text-classification material and an **unfinished** Phi-2 SFT/DPO draft. Some draft code is not executable as-is. | PyTorch, Transformers, DistilBERT; planned SFT/DPO |
| **[MCP + LangChain + LangGraph Trading Simulation](https://github.com/su394611-del/Stock-market-trading-Application-using-MCP-langchain-langgraph)** | Tool calling, MCP servers, agent workflows, and simulated market information/trading actions. **No live brokerage orders are placed.** | Model Context Protocol, LangChain, LangGraph, Python |

## Explore by engineering topic

### Retrieval-augmented generation (RAG) and semantic search

- [Multi-Tenant RAG Service](https://github.com/su394611-del/RAG-service) — vector similarity search, tenant-aware retrieval, embeddings, caching, API integration, and illustrative safeguards.

### LLM training, fine-tuning, and distributed computing

- [LLM Fine-Tuning & Preference Optimization](https://github.com/su394611-del/Pre-training-and-Fine-tuning) — LoRA, supervised fine-tuning (SFT), direct preference optimization (DPO), and odds ratio preference optimization (ORPO).
- [Distributed Data Parallel LLM Training](https://github.com/su394611-del/Distributed-Data-Parallel-Processing) — distributed training, gradient synchronization, `torchrun`, and LoRA.
- [DistilBERT Full vs. Head-Only Fine-Tuning](https://github.com/su394611-del/Full-Fine-Training-Pre-Training-Mid-Training) — text classification and training-strategy comparisons.
- [Transformer Training & Alignment Draft](https://github.com/su394611-del/Transformers-Training) — implemented classification examples and clearly identified incomplete alignment material.

### Transformers, inference, and model internals

- [MedSparse Healthcare](https://github.com/su394611-del/MedSparse-Healthcare-LLM-From-Scratch) — a sparse Mixture-of-Experts decoder trained from scratch on healthcare text, with a [live site](https://su394611-del.github.io/MedSparse-Healthcare-LLM-From-Scratch/) and an in-browser [model playground](https://su394611-del.github.io/playground/).
- [Transformer Encoder from Scratch](https://github.com/su394611-del/LLM-from-scratch) — multi-head self-attention, masking, positional encoding, normalization, and encoder blocks.
- [Parallel LLM Inference](https://github.com/su394611-del/Parallel-LLM-Inference) — multi-process batch inference, model replicas, output ordering, and JSONL processing.

### Agentic AI, multi-agent systems, and MCP

- [Multi-Agent Workflows with LangGraph](https://github.com/su394611-del/Multi-agents-using-LangGraph) — graph-based orchestration and runnable workflow examples.
- [MCP + LangChain + LangGraph Trading Simulation](https://github.com/su394611-del/Stock-market-trading-Application-using-MCP-langchain-langgraph) — MCP tool integration, tool-based agents, and synthetic trading scenarios.

## Technologies demonstrated

**AI/ML:** PyTorch · Hugging Face Transformers · PEFT/LoRA · TRL (SFT/DPO/ORPO) · Transformer attention · DistributedDataParallel

**Agentic AI:** LangGraph · LangChain · Model Context Protocol (MCP) · tool-calling workflows

**RAG / APIs:** Qdrant · Sentence Transformers · vector retrieval · FastAPI

**Development:** Python · Jupyter notebooks · JSONL datasets · Windows/VS Code workflows · selected Google Colab/Kaggle examples

**LLM from scratch:** an educational Transformer encoder, Tiny GPT (a 1.06M-parameter GPT-2-style decoder trained from random weights on TinyStories) and MedSparse Healthcare (a 38.8M-parameter sparse Mixture-of-Experts decoder trained from scratch on healthcare text).

These keywords reflect the public examples; they should not be read as a certification or a claim of production use for every technology.

## Getting started

1. **Choose a project** from the [project directory](#project-directory).
2. **Read that repository's README** for requirements, supported Python/library versions, and setup commands.
3. **Use its notebook or script** and begin with a smoke test or offline example when one is available.
4. **Review the limitations** before trying model downloads, GPU execution, paid API calls, or any integration outside a local test.

Because these projects have different dependency and hardware requirements, **there is no single installation command for the entire profile**.

## Documentation and discoverability

Each linked repository may contain a project README, Python source code, notebooks, requirements files, diagrams, and supporting documentation. For the best view of the implementation, navigate directly to its source repository rather than relying on this overview alone.

**GitHub Search:** [Search repositories on this profile](https://github.com/search?q=user%3Asu394611-del&type=repositories)

**Google Search:** [Find publicly indexed GitHub pages for this account](https://www.google.com/search?q=site%3Agithub.com%2Fsu394611-del)

> Public repositories can be discovered by search engines, but this README does **not** request or guarantee Google indexing. A separately published, verified GitHub Pages site can be submitted through Google Search Console.

## Contact and collaboration

Explore the [public repositories](https://github.com/su394611-del?tab=repositories) for code, technical notes, and project-specific documentation. For questions or proposed improvements, use the relevant repository's GitHub Issues or Discussions, if enabled.

## License
This project is licensed under the [Apache License, Version 2.0](LICENSE). © 2026 Sudhanshu Shukla.

<div align="center">

**Topics:** Generative AI · Agentic AI · RAG · LLM Fine-Tuning · Transformer Architecture · PyTorch · Multi-Agent Systems · LangGraph · LangChain · MCP · Distributed Training · Parallel Inference

[GitHub Profile](https://github.com/su394611-del)

</div>
