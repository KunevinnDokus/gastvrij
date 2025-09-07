import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-hospitality-50 to-hospitality-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welkom bij{' '}
            <span className="text-hospitality-600">Gastvrij.eu</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Het premium platform voor Belgische hospitality management met volledige GDPR-compliance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="hospitality-button">
              <Link href="/properties">Ontdek Eigenschappen</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/host">Word Host</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Waarom Gastvrij.eu?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Speciaal ontworpen voor de Belgische markt met aandacht voor privacy en compliance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">🔒</span>
                </div>
                GDPR Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Volledige naleving van Belgische en Europese privacywetgeving. Uw gastgegevens zijn veilig.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">📱</span>
                </div>
                Mobile-First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Geoptimaliseerd voor mobiele apparaten. Beheer uw eigenschappen overal, altijd.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">🇧🇪</span>
                </div>
                Belgisch Vriendelijk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Ondersteuning voor Nederlandse en Franse talen. Lokale betalingsmethoden en valuta.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">⚡</span>
                </div>
                Snelle Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Next.js 14 met Server Components voor optimale snelheid en gebruikerservaring.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">💳</span>
                </div>
                Lokale Betalingen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Ondersteuning voor Bancontact, iDEAL en andere Belgische betalingsmethoden.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">📊</span>
                </div>
                Analytics & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                GDPR-compliant analytics om uw hospitality business te optimaliseren.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-hospitality-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Klaar om te beginnen?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Sluit u aan bij de groeiende gemeenschap van Belgische hospitality professionals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Gratis Account Aanmaken</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-hospitality-600">
              <Link href="/contact">Contact Opnemen</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
