import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'homepage' });
  
  return (
    <main className="min-h-screen bg-warm-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-warm-white to-soft-gray py-20 lg:py-32">
        <div className="hero-visual absolute inset-0 opacity-10">
          <Image 
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
            alt={t('hero.tagline')}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-color mb-6 drop-shadow-sm">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-accent-color italic mb-8 max-w-2xl mx-auto">
              {t('hero.tagline')}
            </p>
            <p className="text-lg md:text-xl text-text-light mb-12 max-w-3xl mx-auto">
              {t('hero.description')}
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-primary-color to-secondary-color text-white hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 px-10 py-6 text-lg rounded-full uppercase tracking-wide">
              <Link href="#register">{t('hero.cta')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Problems Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-color text-center mb-16 relative">
            {t('problems.title')}
            <div className="absolute left-1/2 transform -translate-x-1/2 mt-4 w-20 h-1 bg-secondary-color rounded-full"></div>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader className="p-0">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <Image 
                    src="https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=400&q=80"
                    alt={t('problems.administrative.alt')}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <CardTitle className="text-xl mb-4 text-accent-color">
                  {t('problems.administrative.title')}
                </CardTitle>
                <div 
                  className="text-text-light leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t('problems.administrative.description') }}
                />
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader className="p-0">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <Image 
                    src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=400&q=80"
                    alt={t('problems.time.alt')}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <CardTitle className="text-xl mb-4 text-accent-color">
                  {t('problems.time.title')}
                </CardTitle>
                <div 
                  className="text-text-light leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t('problems.time.description') }}
                />
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader className="p-0">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <Image 
                    src="https://images.unsplash.com/photo-1616587894289-86480e533129?auto=format&fit=crop&w=400&q=80"
                    alt={t('problems.software.alt')}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <CardTitle className="text-xl mb-4 text-accent-color">
                  {t('problems.software.title')}
                </CardTitle>
                <div 
                  className="text-text-light leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t('problems.software.description') }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-color text-center mb-16 relative">
            {t('solution.title')}
            <div className="absolute left-1/2 transform -translate-x-1/2 mt-4 w-20 h-1 bg-secondary-color rounded-full"></div>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto items-start">
            {/* Before/After Comparison */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-red-50 rounded-xl border-l-4 border-red-400">
                <h4 className="font-bold text-red-800 mb-3">{t('solution.before.title')}</h4>
                <div className="relative h-48 mb-3 rounded-lg overflow-hidden">
                  <Image 
                    src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80"
                    alt={t('solution.before.alt')}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-red-700 text-sm">{t('solution.before.description')}</p>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-xl border-l-4 border-green-400">
                <h4 className="font-bold text-green-800 mb-3">{t('solution.after.title')}</h4>
                <div className="relative h-48 mb-3 rounded-lg overflow-hidden">
                  <Image 
                    src="https://images.unsplash.com/photo-1600298881974-6be191ceeda1?auto=format&fit=crop&w=500&q=80"
                    alt={t('solution.after.alt')}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-green-700 text-sm">{t('solution.after.description')}</p>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="text-2xl font-bold text-primary-color mb-8">
                {t('solution.benefits.title')}
              </h3>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div dangerouslySetInnerHTML={{ __html: t('solution.benefits.time') }} />
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div dangerouslySetInnerHTML={{ __html: t('solution.benefits.weekend') }} />
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div dangerouslySetInnerHTML={{ __html: t('solution.benefits.tax') }} />
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div dangerouslySetInnerHTML={{ __html: t('solution.benefits.history') }} />
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div dangerouslySetInnerHTML={{ __html: t('solution.benefits.savings') }} />
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div dangerouslySetInnerHTML={{ __html: t('solution.benefits.mobile') }} />
                </li>
              </ul>
              
              <div className="bg-soft-gray p-6 rounded-xl border-l-4 border-secondary-color">
                <div 
                  className="italic text-lg mb-4 text-text-dark"
                  dangerouslySetInnerHTML={{ __html: t('solution.testimonial.quote') }}
                />
                <p className="text-text-light text-sm">{t('solution.testimonial.author')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-color mb-8 relative">
              {t('target.title')}
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-4 w-20 h-1 bg-secondary-color rounded-full"></div>
            </h2>
            <div 
              className="text-xl text-text-dark leading-relaxed mb-12"
              dangerouslySetInnerHTML={{ __html: t('target.description') }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <Card className="border-t-4 border-secondary-color shadow-lg">
              <CardContent className="p-6">
                <CardTitle className="text-lg mb-4 text-primary-color">
                  {t('target.traits.personal.title')}
                </CardTitle>
                <p className="text-text-light leading-relaxed">
                  {t('target.traits.personal.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-secondary-color shadow-lg">
              <CardContent className="p-6">
                <CardTitle className="text-lg mb-4 text-primary-color">
                  {t('target.traits.local.title')}
                </CardTitle>
                <p className="text-text-light leading-relaxed">
                  {t('target.traits.local.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-secondary-color shadow-lg">
              <CardContent className="p-6">
                <CardTitle className="text-lg mb-4 text-primary-color">
                  {t('target.traits.quality.title')}
                </CardTitle>
                <p className="text-text-light leading-relaxed">
                  {t('target.traits.quality.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-secondary-color shadow-lg">
              <CardContent className="p-6">
                <CardTitle className="text-lg mb-4 text-primary-color">
                  {t('target.traits.outsourcing.title')}
                </CardTitle>
                <p className="text-text-light leading-relaxed">
                  {t('target.traits.outsourcing.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="register" className="relative overflow-hidden">
        <div className="relative h-[600px] flex items-center justify-center">
          <Image 
            src="https://images.unsplash.com/photo-1600298882974-997831947387?auto=format&fit=crop&w=800&q=80"
            alt={t('cta.alt')}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-accent-color/90"></div>
          <div className="relative z-10 text-center text-white p-8 max-w-4xl mx-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t('cta.title')}
            </h2>
            <div 
              className="text-xl mb-8 opacity-90 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t('cta.description') }}
            />
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
                ✓ {t('cta.benefits.trial')}
              </span>
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
                ✓ {t('cta.benefits.setup')}
              </span>
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
                ✓ {t('cta.benefits.cancel')}
              </span>
            </div>
            <Button asChild size="lg" className="bg-secondary-color text-text-dark hover:bg-secondary-color/90 px-12 py-6 text-lg rounded-full uppercase tracking-wide font-bold transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <Link href="mailto:info@gastvrij.eu?subject=14%20dagen%20gratis%20proberen&body=Hallo,%0A%0AIk%20wil%20Gastvrij.eu%2014%20dagen%20gratis%20proberen.%0A%0ANaam%20logies:%0AAantal%20kamers:%0ALocatie:%0AContactpersoon:%0ATelefoon:%0A%0AMet%20vriendelijke%20groet">
                {t('cta.button')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-dark text-white py-12 text-center">
        <div className="container mx-auto px-4">
          <p className="opacity-80">
            © 2025 Gastvrij.eu - {t('hero.tagline')}
          </p>
        </div>
      </footer>
    </main>
  );
}