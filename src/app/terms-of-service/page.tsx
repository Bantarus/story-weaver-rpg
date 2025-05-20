
// src/app/terms-of-service/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose max-w-none text-foreground">
              <p className="text-lg font-semibold mb-4">Last Updated: [Date]</p>

              <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
              <p>
                Welcome to Story Weaver RPG! By accessing or using our application (the &quot;Service&quot;), 
                you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of 
                the terms, then you may not access the Service.
              </p>
              <p className="mt-4 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
                <strong>Important:</strong> This is a placeholder Terms of Service. You must replace this 
                content with your own comprehensive and legally sound Terms of Service agreement. 
                Consult with a legal professional to ensure compliance with all applicable laws and regulations.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">2. Description of Service</h2>
              <p>
                Story Weaver RPG is an application that allows users to generate personalized text-based 
                role-playing adventures using AI technology. Users can input story text, define characters, 
                and generate interactive narratives.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-2">3. User Accounts (Placeholder)</h2>
              <p>
                If user accounts are implemented, you will be responsible for maintaining the confidentiality 
                of your account and password and for restricting access to your computer.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">4. User Content (Placeholder)</h2>
              <p>
                If users can submit or create content, outline the terms regarding ownership, rights, 
                and responsibilities for that content.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">5. Prohibited Conduct (Placeholder)</h2>
              <p>
                List activities that are not permitted on the Service.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">6. Intellectual Property (Placeholder)</h2>
              <p>
                The Service and its original content (excluding content provided by users), features, 
                and functionality are and will remain the exclusive property of [Your Company Name/Your Name] 
                and its licensors.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">7. Termination (Placeholder)</h2>
              <p>
                We may terminate or suspend access to our Service immediately, without prior notice or 
                liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">8. Limitation of Liability (Placeholder)</h2>
              <p>
                In no event shall [Your Company Name/Your Name], nor its directors, employees, partners, 
                agents, suppliers, or affiliates, be liable for any indirect, incidental, special, 
                consequential or punitive damages...
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">9. Governing Law (Placeholder)</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of 
                [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">10. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material we will try to provide at least 30 days&apos; notice prior to any 
                new terms taking effect.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">11. Contact Us (Placeholder)</h2>
              <p>
                If you have any questions about these Terms, please contact us at [Your Contact Email/Link].
              </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
