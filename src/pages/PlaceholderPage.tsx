import PageHeader from '../components/ui/PageHeader';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description="Content coming soon." />
    </div>
  );
}
