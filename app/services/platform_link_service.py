import urllib.parse
from typing import Dict, Optional


class PlatformLinkService:
    """
    Generates search and product discovery URLs for supported external platforms.
    Distinguishes AI recommendations from live links per Phase 12 of the development plan.
    """

    PLATFORM_SEARCH_TEMPLATES = {
        "Amazon": "https://www.amazon.in/s?k={query}",
        "Flipkart": "https://www.flipkart.com/search?q={query}",
        "IKEA": "https://www.ikea.com/in/en/search/?q={query}",
        "Swiggy": "https://www.swiggy.com/search?query={query}",
        "Zomato": "https://www.zomato.com/search?q={query}",
        "OYO": "https://www.oyorooms.com/search?location={query}",
        "Myntra": "https://www.myntra.com/{query}",
        "Tanishq": "https://www.tanishq.co.in/search?q={query}"
    }

    # Default platform fallback based on planner domain
    DOMAIN_DEFAULTS = {
        "home": "Amazon",
        "party": "Zomato",
        "jewelry": "Amazon"
    }

    @classmethod
    def generate_search_url(
        cls,
        item_name: str,
        platform: Optional[str] = None,
        domain: str = "home"
    ) -> str:
        """
        Builds a safe, URL-encoded search link for an item on the given platform.
        """
        chosen_platform = platform or cls.DOMAIN_DEFAULTS.get(domain, "Amazon")
        template = cls.PLATFORM_SEARCH_TEMPLATES.get(chosen_platform)

        if not template:
            # Default to Amazon if platform is unrecognized
            template = cls.PLATFORM_SEARCH_TEMPLATES["Amazon"]
            chosen_platform = "Amazon"

        encoded_query = urllib.parse.quote_plus(item_name.strip())
        return template.format(query=encoded_query)

    @classmethod
    def get_supported_platforms(cls) -> Dict[str, str]:
        """
        Returns list of supported platform names.
        """
        return list(cls.PLATFORM_SEARCH_TEMPLATES.keys())


platform_link_service = PlatformLinkService()
