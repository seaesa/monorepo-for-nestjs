import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthCard({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}
