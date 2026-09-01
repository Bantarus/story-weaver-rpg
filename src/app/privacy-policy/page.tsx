
// src/app/privacy-policy/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose max-w-none text-foreground">
              <p className="text-lg font-semibold mb-4">Last Updated: September 1, 2026</p>

              <p>
                Welcome to Story Weaver RPG. Your privacy is important to us. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our application.
              </p>
              <p className="mt-4 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
                <strong>Important:</strong> This is a placeholder Privacy Policy. You must replace this 
                content with your own comprehensive and legally sound Privacy Policy. 
                Consult with a legal professional to ensure compliance with all applicable privacy laws 
                (e.g., GDPR, CCPA).
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
              <p>
                We may collect information about you in a variety of ways. The information we may collect 
                via the Application depends on the content and materials you use, and includes:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, 
                  that you voluntarily give to us when you register with the Application or when you choose 
                  to participate in various activities related to the Application. (Currently, this app does not have user registration).
                </li>
                <li>
                  <strong>Usage Data:</strong> Information your browser sends whenever you visit our Service or when 
                  you access the Service by or through a mobile device. (e.g. IP address, browser type, pages visited).
                </li>
                <li>
                  <strong>Content Data:</strong> Story text, character descriptions, and other content you input into 
                  the application for generating RPGs. This data is processed by AI models to provide the service.
                  Data you save (e.g., adventures, characters) is stored in your browser's localStorage.
                </li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-2">2. Use of Your Information</h2>
              <p>
                Having accurate information permits us to provide you with a smooth, efficient, and customized 
                experience. Specifically, we may use information collected about you via the Application to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Create and manage your account (if applicable).</li>
                <li>Provide and improve the Service.</li>
                <li>Process your inputs to generate RPG content.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-2">3. Disclosure of Your Information</h2>
              <p>
                We may share information we have collected about you in certain situations. Your information 
                may be disclosed as follows:
              </p>
               <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you 
                  is necessary to respond to legal process, to investigate or remedy potential violations of our 
                  policies, or to protect the rights, property, and safety of others.
                </li>
                <li>
                  <strong>Third-Party Service Providers:</strong> We may share your information with third-party 
                  vendors, service providers, contractors or agents who perform services for us or on our behalf 
                  and require access to such information to do that work. This includes AI model providers (e.g., Google AI). 
                  Their use of your data is governed by their respective privacy policies.
                </li>
              </ul>

              <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Storage and Security</h2>
              <p>
                We use administrative, technical, and physical security measures to help protect your personal 
                information. While we have taken reasonable steps to secure the personal information you provide 
                to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
                Adventures and characters you explicitly save are stored in your browser's localStorage.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">5. Your Data Rights</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal data, such as 
                the right to access, correct, or delete your data.
              </p>
              
              <h2 className="text-xl font-semibold mt-6 mb-2">6. Cookies and Tracking Technologies</h2>
              <p>
                We may use cookies, web beacons, tracking pixels, and other tracking technologies on the 
                Application to help customize the Application and improve your experience.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page.
              </p>

              <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact Us</h2>
              <p>
                If you have questions or comments about this Privacy Policy, please contact us at: 
                <a href="https://github.com/Bantarus/story-weaver-rpg/issues" className="text-primary hover:underline">the project issue tracker on GitHub</a>
              </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
