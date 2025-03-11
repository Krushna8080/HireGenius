import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative isolate bg-white">
      <div className="mx-auto max-w-4xl py-12 sm:py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Welcome to <span className="text-blue-600">HireGenius</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            The next-generation recruitment platform powered by AI. Connect with the right talent or find your dream job with our intelligent matching system.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/register"
              className="rounded-md bg-blue-600 px-5 py-3 text-md font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Get started
            </Link>
            <Link href="/jobs" className="text-md font-semibold leading-6 text-gray-900">
              Browse jobs <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="mt-10 sm:mt-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Powerful Features for Recruiters and Job Seekers
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform leverages the latest in AI technology to streamline the recruitment process and help candidates find their perfect match.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  Intelligent Resume Processing
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Our AI system extracts and organizes key information from resumes, making it easier for recruiters to find the right candidates.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  Smart Job-Candidate Matching
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Our algorithms analyze job requirements and candidate profiles to create ideal matches, saving time and improving hiring outcomes.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  Resume Improvement Suggestions
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Job seekers receive tailored feedback to enhance their resumes and improve their chances of landing interviews.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
