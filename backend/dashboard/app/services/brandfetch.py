import httpx
from typing import Optional


class BrandfetchService:
    BASE_URL = "https://api.brandfetch.io/v2/search"
    API_KEY = "1idwxAkZbq1G6nuxGEu"
    
    async def fetch_company(self, query: str) -> Optional[list]:
        """
        Fetch company data from Brandfetch API.
        
        Args:
            query: Company name or domain to search for
            
        Returns:
            List of company dictionaries or empty list if not found
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.BASE_URL}/{query}",
                    params={"c": self.API_KEY},
                    headers={"Accept": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Brandfetch search returns an array of results
                    if not data or len(data) == 0:
                        return []
                    
                    # Get first 4 results
                    results = []
                    for brand in data[:4]:
                        # Extract logo URL
                        logo_url = None
                        if brand.get("logos") and len(brand["logos"]) > 0:
                            formats = brand["logos"][0].get("formats", [])
                            if formats and len(formats) > 0:
                                logo_url = formats[0].get("src")
                        
                        # Extract brand colors
                        brand_colors = None
                        if brand.get("colors"):
                            colors = [c.get("hex") for c in brand["colors"][:3] if c.get("hex")]
                            if colors:
                                brand_colors = {"primary": colors[0], "secondary": colors[1] if len(colors) > 1 else colors[0]}
                        
                        results.append({
                            "name": brand.get("name"),
                            "logo_url": logo_url,
                            "brand_colors": brand_colors,
                            "domain": brand.get("domain", query)
                        })
                    
                    return results
        except Exception as e:
            print(f"Error fetching from Brandfetch: {e}")
            return []
        
        return []
