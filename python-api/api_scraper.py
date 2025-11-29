# API Flask pour le scraper Playwright
# Déployez ce fichier sur votre VPS Ubuntu

from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import List, Dict, Tuple
import random
import time
import os
from urllib.parse import urlparse, quote_plus

from playwright.sync_api import sync_playwright

app = Flask(__name__)
CORS(app)  # Permet les requêtes cross-origin depuis l'app React


def _human_sleep(min_ms: int = 300, max_ms: int = 1200) -> None:
    """Pause courte avec une durée aléatoire pour imiter un humain."""
    delay = random.uniform(min_ms, max_ms) / 1000.0
    time.sleep(delay)


def _human_type(page, selector: str, text: str) -> None:
    """Clique dans un champ et tape le texte avec un léger délai entre les caractères."""
    try:
        loc = page.locator(selector)
        if loc.count() == 0:
            return
        field = loc.first
        field.click()
        _human_sleep()
        field.type(text, delay=random.randint(60, 140))
        _human_sleep()
    except Exception:
        try:
            page.fill(selector, text)
        except Exception:
            pass


def _human_scroll(page) -> None:
    """Fait défiler un peu la page comme le ferait un utilisateur."""
    try:
        steps = random.randint(1, 3)
        for _ in range(steps):
            page.mouse.wheel(0, random.randint(300, 700))
            _human_sleep(200, 600)
    except Exception:
        pass


def _use_droit_search(page, term: str) -> None:
    """Ouvre la barre de recherche sur droitdusport.com et lance la recherche."""
    try:
        page.get_by_role("img", name="Icône de recherche").click()
        _human_sleep()
    except Exception:
        selectors = [
            "button[aria-label*='recherche' i]",
            "button[title*='recherche' i]",
            ".search-toggle",
            "button .fa-search",
            "a[href*='search']",
        ]
        for sel in selectors:
            try:
                loc = page.locator(sel)
                if loc.count() > 0 and loc.first.is_visible():
                    loc.first.click()
                    _human_sleep()
                    break
            except Exception:
                continue

    try:
        search_input = page.get_by_role("textbox", name="Effectuer une recherche texte")
        search_input.click()
        _human_sleep()
        search_input.type(term, delay=random.randint(60, 140))
        page.get_by_role("button", name="icone recherche").click()
        page.wait_for_load_state("networkidle")
        _human_sleep()
        return
    except Exception:
        pass

    input_selectors = [
        "#searchBarJournal",
        "input[aria-label*='recherche' i]",
        "input[placeholder*='recherche' i]",
        "input[type='search']",
    ]
    for sel in input_selectors:
        try:
            loc = page.locator(sel)
            if loc.count() > 0 and loc.first.is_visible():
                loc.first.click()
                _human_sleep()
                loc.first.type(term, delay=random.randint(60, 140))
                loc.first.press("Enter")
                page.wait_for_load_state("networkidle")
                _human_sleep()
                return
        except Exception:
            continue


def scrape_droitdusport(
    username: str,
    password: str,
    urls: List[str],
    headless: bool = True,
    max_depth: int = 0,
    search_keyword: str = "",
) -> Dict:
    """
    Utilise Playwright pour se connecter à droitdusport.com et scraper le contenu.
    """
    results: List[Dict] = []

    with sync_playwright() as p:
        headless_env = os.environ.get("PLAYWRIGHT_HEADLESS", "").lower()
        effective_headless = headless
        if headless_env in ("false", "0", "no"):
            effective_headless = False
        elif headless_env in ("true", "1", "yes"):
            effective_headless = True

        browser = p.chromium.launch(headless=effective_headless)
        context = browser.new_context()
        page = context.new_page()

        # Page d'accueil + connexion
        page.goto("https://www.droitdusport.com/", wait_until="networkidle")
        _human_sleep()
        try:
            page.get_by_text("S'identifier", exact=False).click()
        except Exception:
            pass

        _human_type(page, "#username", username)
        _human_type(page, "#password", password)
        try:
            page.get_by_role("button", name="Se connecter").click()
        except Exception:
            try:
                page.click("button.btn.btn-dds[type='submit']")
            except Exception:
                pass

        page.wait_for_load_state("networkidle")
        _human_sleep()

        # Recherche par mot-clé
        targets: List[str] = []
        if search_keyword:
            try:
                _use_droit_search(page, search_keyword)
            except Exception:
                encoded = quote_plus(search_keyword)
                search_url = (
                    "https://www.droitdusport.com/search?"
                    f"gsh%5BtextQuery%5D={encoded}&"
                    "gsh%5BcontentTemplate%5D=last_actualite"
                )
                page.goto(search_url, wait_until="networkidle")
            targets.append(page.url)
        else:
            targets.extend(urls)

        visited: set = set()
        queue: List[Tuple[str, int]] = [(u, 0) for u in targets]

        while queue:
            u, depth = queue.pop(0)
            if u in visited or depth > max_depth:
                continue
            visited.add(u)

            try:
                page.goto(u, wait_until="networkidle")
                _human_sleep()
                _human_scroll(page)
            except Exception as exc:
                results.append({"url": u, "error": str(exc), "text": ""})
                continue

            try:
                blocks = page.locator(".search-result")
                count = blocks.count()
            except Exception:
                blocks = None
                count = 0

            if blocks is None or count == 0:
                try:
                    text = page.text_content("body") or ""
                    results.append({"url": u, "text": text})
                except Exception as exc:
                    results.append({"url": u, "error": str(exc), "text": ""})
            else:
                for i in range(count):
                    try:
                        block = blocks.nth(i)
                        title_loc = block.locator("a").first
                        title = (title_loc.text_content() or "").strip()
                        link = title_loc.get_attribute("href") or u
                        snippet = (block.text_content() or "").strip()
                        results.append({
                            "url": link,
                            "title": title,
                            "text": snippet,
                        })
                    except Exception:
                        continue

            if depth >= max_depth:
                continue

            try:
                links = page.locator("a[href]").evaluate_all("els => els.map(e => e.href)")
            except Exception:
                links = []

            for link in links:
                if not isinstance(link, str):
                    continue
                parsed = urlparse(link)
                host = parsed.hostname or ""
                if host.endswith("droitdusport.com") and link not in visited:
                    queue.append((link, depth + 1))

        context.close()
        browser.close()

    return {"items": results}


@app.route('/scrape-droit', methods=['POST'])
def scrape():
    """Endpoint pour lancer le scraping."""
    data = request.json
    
    username = data.get('username', '')
    password = data.get('password', '')
    urls = data.get('urls', [])
    keyword = data.get('keyword', '')
    max_depth = data.get('max_depth', 0)
    
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    
    try:
        result = scrape_droitdusport(
            username=username,
            password=password,
            urls=urls,
            search_keyword=keyword,
            max_depth=max_depth,
            headless=True
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def scrape_dalloz(
    username: str,
    password: str,
    search_keyword: str = "",
    headless: bool = True,
) -> Dict:
    """
    Utilise Playwright pour se connecter à Dalloz via le portail de l'université de Bourgogne.
    """
    results: List[Dict] = []

    with sync_playwright() as p:
        headless_env = os.environ.get("PLAYWRIGHT_HEADLESS", "").lower()
        effective_headless = headless
        if headless_env in ("false", "0", "no"):
            effective_headless = False
        elif headless_env in ("true", "1", "yes"):
            effective_headless = True

        browser = p.chromium.launch(headless=effective_headless)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Accès au catalogue de la BU
            page.goto("https://catalogue-bu.u-bourgogne.fr/discovery/dbsearch?vid=33UB_INST:33UB_INST&lang=fr", wait_until="networkidle")
            _human_sleep()

            # Clic sur S'inscrire (bouton de connexion)
            page.get_by_role("button", name="S'inscrire").click()
            _human_sleep()

            # Connexion universitaire
            page.locator("#username").fill(username)
            _human_sleep(200, 400)
            page.locator("#password").fill(password)
            _human_sleep(200, 400)
            page.get_by_role("button", name="CONNEXION").click()
            page.wait_for_load_state("networkidle")
            _human_sleep()

            # Recherche de Dalloz dans le catalogue
            page.get_by_role("combobox", name="Rechercher").click()
            _human_sleep()
            page.get_by_role("combobox", name="Rechercher").fill("dalloz")
            _human_sleep()
            page.get_by_role("option", name="Dalloz", exact=True).click()
            _human_sleep()
            page.get_by_role("link", name="Dalloz", exact=True).click()
            page.wait_for_load_state("networkidle")
            _human_sleep()

            # Ouvre Dalloz dans un popup
            with page.expect_popup() as page1_info:
                page.get_by_role("link", name="Dalloz - Base de données -").click()
            dalloz_page = page1_info.value
            dalloz_page.wait_for_load_state("networkidle")
            _human_sleep()

            # Si un mot-clé est fourni, effectuer une recherche sur Dalloz
            if search_keyword:
                try:
                    # Cherche le champ de recherche sur Dalloz
                    search_selectors = [
                        "input[type='search']",
                        "input[placeholder*='recherche' i]",
                        "input[name*='search' i]",
                        "#search",
                        ".search-input",
                    ]
                    for sel in search_selectors:
                        try:
                            loc = dalloz_page.locator(sel)
                            if loc.count() > 0 and loc.first.is_visible():
                                loc.first.click()
                                _human_sleep()
                                loc.first.type(search_keyword, delay=random.randint(60, 140))
                                loc.first.press("Enter")
                                dalloz_page.wait_for_load_state("networkidle")
                                _human_sleep()
                                break
                        except Exception:
                            continue
                except Exception as e:
                    print(f"Erreur recherche Dalloz: {e}")

            # Extraction du contenu
            try:
                text = dalloz_page.text_content("body") or ""
                results.append({
                    "url": dalloz_page.url,
                    "title": "Dalloz - Résultats",
                    "text": text[:50000]  # Limite à 50k caractères
                })
            except Exception as e:
                results.append({
                    "url": "https://www.dalloz.fr",
                    "error": str(e),
                    "text": ""
                })

            # Extraction des liens de résultats si présents
            try:
                result_links = dalloz_page.locator("a[href*='/documentation/']").evaluate_all(
                    "els => els.slice(0, 10).map(e => ({href: e.href, text: e.textContent}))"
                )
                for link_info in result_links:
                    if isinstance(link_info, dict):
                        results.append({
                            "url": link_info.get("href", ""),
                            "title": (link_info.get("text", "") or "").strip()[:200],
                            "text": ""
                        })
            except Exception:
                pass

        except Exception as e:
            results.append({
                "url": "https://www.dalloz.fr",
                "error": f"Erreur de connexion: {str(e)}",
                "text": ""
            })

        context.close()
        browser.close()

    return {"items": results}


@app.route('/scrape-dalloz', methods=['POST'])
def scrape_dalloz_endpoint():
    """Endpoint pour scraper Dalloz via le portail universitaire."""
    data = request.json
    
    username = data.get('username', '')
    password = data.get('password', '')
    keyword = data.get('keyword', '')
    
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    
    try:
        result = scrape_dalloz(
            username=username,
            password=password,
            search_keyword=keyword,
            headless=True
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Endpoint de santé pour vérifier que l'API fonctionne."""
    return jsonify({"status": "ok"})


if __name__ == '__main__':
    # Lancez avec: python api_scraper.py
    # Ou avec PM2: pm2 start api_scraper.py --interpreter python3
    app.run(host='0.0.0.0', port=5000, debug=False)
