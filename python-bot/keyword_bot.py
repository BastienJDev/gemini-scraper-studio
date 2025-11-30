#!/usr/bin/env python3
"""
Bot simple : cherche des occurrences de mots-clés dans une liste de sites.

Usage rapide :
  python3 keyword_bot.py --sites sites.txt --keywords "cdd sportif, contrat"
  python3 keyword_bot.py --sites sites.txt --keywords-file keywords.txt --json-output resultats.json

Notes :
- Pas de rendu JS (fetch HTML simple). Pour les sites full JS, ce bot ne verra rien.
- On extrait le texte de la page, puis on cherche chaque mot-clé (accent-insensible).
"""
import argparse
import json
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Iterable, Set

import requests
from bs4 import BeautifulSoup

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
}


@dataclass
class Occurrence:
    url: str
    keyword: str
    snippet: str


def normalize(text: str) -> str:
    return (
        unicodedata.normalize("NFD", text or "")
        .encode("ascii", "ignore")
        .decode()
        .lower()
    )


def clean_url(url: str) -> str:
  return url.split(" ")[0].split("(")[0].strip()


def load_list_from_file(path: Path, categories: Set[str]) -> List[str]:
  if not path.exists():
    raise FileNotFoundError(f"Fichier introuvable : {path}")

  # Support JSON (sites.json) or simple text
  if path.suffix.lower() == ".json":
    try:
      data = json.loads(path.read_text())
    except Exception as e:
      raise ValueError(f"Impossible de lire le JSON {path}: {e}")

    urls: List[str] = []
    for item in data:
      url = clean_url(str(item.get("URL", "")))
      if not url:
        continue
      if categories:
        cat = str(item.get("CATEGORIES", "")).lower()
        if not any(c in cat for c in categories):
          continue
      urls.append(url)
    return urls

  return [line.strip() for line in path.read_text().splitlines() if line.strip()]


def fetch_text(url: str, timeout: int = 15) -> str:
    resp = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    # Retirer scripts/styles
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    # Nettoyage basique
    text = re.sub(r"\s+", " ", text)
    return text


def find_occurrences(text: str, url: str, keywords: Iterable[str], max_len: int = 240) -> List[Occurrence]:
    norm_text = normalize(text)
    occs: List[Occurrence] = []
    for kw in keywords:
        norm_kw = normalize(kw)
        if not norm_kw:
            continue
        start = 0
        found = False
        while True:
            idx = norm_text.find(norm_kw, start)
            if idx == -1:
                break
            found = True
            # Construire un snippet autour de l'occurrence
            raw_start = max(0, idx - 120)
            raw_end = min(len(text), idx + len(kw) + 120)
            snippet = text[raw_start:raw_end].strip()
            if len(snippet) > max_len:
                snippet = snippet[:max_len] + "..."
            occs.append(Occurrence(url=url, keyword=kw, snippet=snippet))
            start = idx + len(norm_kw)
            if len(occs) >= 5:  # limiter les occurrences par page
                break
        if found:
            continue
    return occs


def scrape_sites(sites: List[str], keywords: List[str], timeout: int = 15) -> Dict[str, List[Occurrence]]:
    results: Dict[str, List[Occurrence]] = {}
    for url in sites:
        try:
            text = fetch_text(url, timeout=timeout)
            occs = find_occurrences(text, url, keywords)
            if occs:
                results[url] = occs
        except Exception as e:
            print(f"[WARN] Erreur sur {url}: {e}", file=sys.stderr)
    return results


def main():
  parser = argparse.ArgumentParser(description="Bot de recherche d'occurrences sur une liste de sites.")
  parser.add_argument("--sites", required=True, help="Fichier texte avec une URL par ligne ou un JSON (ex: sites.json)")
  parser.add_argument("--keywords", help="Liste de mots-clés séparés par des virgules")
  parser.add_argument("--keywords-file", help="Fichier texte avec un mot-clé par ligne")
  parser.add_argument("--json-output", help="Chemin du fichier JSON de sortie")
  parser.add_argument("--timeout", type=int, default=15, help="Timeout HTTP (s)")
  parser.add_argument("--categories", help="Filtrer les sites.json par catégories (séparées par virgules, insensible à la casse)")
  args = parser.parse_args()

  categories = set()
  if args.categories:
    categories = {c.strip().lower() for c in args.categories.split(",") if c.strip()}

  sites = load_list_from_file(Path(args.sites), categories)
    keywords: List[str] = []
    if args.keywords:
        keywords.extend([k.strip() for k in args.keywords.split(",") if k.strip()])
    if args.keywords_file:
        keywords.extend(load_list_from_file(Path(args.keywords_file)))
    if not keywords:
        print("Aucun mot-clé fourni (--keywords ou --keywords-file)", file=sys.stderr)
        sys.exit(1)

    results = scrape_sites(sites, keywords, timeout=args.timeout)

    # Affichage
    for url, occs in results.items():
        print(f"\nSite: {url}")
        for occ in occs:
            print(f"  - Mot-clé: {occ.keyword}")
            print(f"    Snippet: {occ.snippet}")

    if args.json_output:
        out_path = Path(args.json_output)
        serialized = {
            url: [occ.__dict__ for occ in occs] for url, occs in results.items()
        }
        out_path.write_text(json.dumps(serialized, ensure_ascii=False, indent=2))
        print(f"\nRésultats écrits dans {out_path}")


if __name__ == "__main__":
    main()
