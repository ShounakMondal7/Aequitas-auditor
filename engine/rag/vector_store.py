"""
Local Vector Store & RAG Retrieval Module for AI Fairness Benchmarks
Powered by ChromaDB.
"""

import os
import glob
from typing import List, Optional
import chromadb
from chromadb.utils import embedding_functions

# Resolve paths relative to this file
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BENCHMARKS_DIR = os.path.join(CURRENT_DIR, "benchmarks")
CHROMA_PERSIST_DIR = os.path.join(CURRENT_DIR, "chroma_db")
COLLECTION_NAME = "fairness_benchmarks"


def get_chroma_client() -> chromadb.ClientAPI:
    """Returns a persistent ChromaDB client instance."""
    os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
    return chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)


def chunk_markdown(content: str, source_name: str) -> List[dict]:
    """
    Splits markdown content into semantic sections based on level 2 headings ('## ').
    Falls back to paragraph splitting for larger sections.
    """
    chunks = []
    sections = content.split("\n## ")
    
    for i, section in enumerate(sections):
        if not section.strip():
            continue
        
        # Prepend '## ' if not the first headerless intro
        section_text = section if i == 0 else f"## {section}"
        title = section_text.splitlines()[0].replace("#", "").strip()
        
        chunks.append({
            "id": f"{source_name}_sec_{i}",
            "text": section_text.strip(),
            "metadata": {
                "source": source_name,
                "section": title,
                "chunk_index": i
            }
        })
        
    return chunks


def populate_vector_store(benchmarks_dir: Optional[str] = None) -> int:
    """
    Scans the benchmarks directory, parses markdown documents,
    and indexes them into the local ChromaDB collection.
    """
    target_dir = benchmarks_dir or BENCHMARKS_DIR
    if not os.path.exists(target_dir):
        raise FileNotFoundError(f"Benchmarks directory not found: {target_dir}")

    client = get_chroma_client()
    
    # Use Chroma's default sentence-transformers / ONNX embedding function
    embedding_fn = embedding_functions.DefaultEmbeddingFunction()
    
    # Get or create collection
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"description": "Regulatory benchmarks and fairness remediation techniques"}
    )

    md_files = glob.glob(os.path.join(target_dir, "*.md"))
    if not md_files:
        print(f"⚠️ No markdown benchmarks found in: {target_dir}")
        return 0

    total_chunks = 0
    all_ids = []
    all_documents = []
    all_metadatas = []

    for file_path in md_files:
        filename = os.path.basename(file_path)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        chunks = chunk_markdown(content, filename)
        for chunk in chunks:
            all_ids.append(chunk["id"])
            all_documents.append(chunk["text"])
            all_metadatas.append(chunk["metadata"])
            total_chunks += 1

    if all_ids:
        # Upsert documents into collection
        collection.upsert(
            ids=all_ids,
            documents=all_documents,
            metadatas=all_metadatas
        )

    print(f"[OK] Successfully indexed {total_chunks} chunks from {len(md_files)} files into ChromaDB.")
    return total_chunks


def get_rag_context(query: str, n_results: int = 3) -> str:
    """
    Retrieves the most relevant fairness benchmarks and remediation strategies
    for a given query string, returning a formatted context string.
    """
    client = get_chroma_client()
    embedding_fn = embedding_functions.DefaultEmbeddingFunction()
    
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn
    )

    if collection.count() == 0:
        # Auto-populate if empty
        populate_vector_store()

    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, max(1, collection.count()))
    )

    retrieved_docs = results.get("documents", [[]])[0]
    retrieved_meta = results.get("metadatas", [[]])[0]

    if not retrieved_docs:
        return "No specific regulatory guidelines found in local vector store."

    context_parts = []
    for doc, meta in zip(retrieved_docs, retrieved_meta):
        source = meta.get("source", "benchmark")
        section = meta.get("section", "General")
        context_parts.append(f"### [Source: {source} | Section: {section}]\n{doc}")

    return "\n\n---\n\n".join(context_parts)


import sys

# Ensure UTF-8 output encoding across Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

if __name__ == "__main__":
    print("[*] Initializing and populating local fairness vector store...")
    populate_vector_store()

    print("\n[?] Running verification query: 'EEOC 4/5ths rule and sample reweighting remediation'")
    context = get_rag_context("EEOC 4/5ths rule and sample reweighting remediation", n_results=2)
    print("\n=== RETRIEVED RAG CONTEXT ===")
    print(context)
    print("================================")

