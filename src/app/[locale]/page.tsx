import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'homepage' });
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-hospitality-50 to-hospitality-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('hero.title').split('<span>').map((part, index) => {
              if (index === 0) return part;
              const [highlighted, rest] = part.split('</span>');
              return (
                <span key={index}>
                  <span className="text-hospitality-600">{highlighted}</span>
                  {rest}
                </span>
              );
            })}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="hospitality-button">
              <Link href="/properties">{t('hero.cta.properties')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/host">{t('hero.cta.host')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">🔒</span>
                </div>
                {t('features.gdpr.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('features.gdpr.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">📱</span>
                </div>
                {t('features.mobile.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('features.mobile.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">🇧🇪</span>
                </div>
                {t('features.belgian.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('features.belgian.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">⚡</span>
                </div>
                {t('features.performance.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('features.performance.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">💳</span>
                </div>
                {t('features.payments.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('features.payments.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hospitality-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-hospitality-100 rounded-full flex items-center justify-center">
                  <span className="text-hospitality-600 font-bold">📊</span>
                </div>
                {t('features.analytics.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('features.analytics.description')}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-hospitality-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">{t('cta.register')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-hospitality-600">
              <Link href="/contact">{t('cta.contact')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
