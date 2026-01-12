/**
 * Lesson Configuration - Video 01: Why You Keep Failing Interviews
 * Lesson Builder System
 */

export const lessonConfig = {
    id: 'video-01',
    title: 'Why You Keep Failing Interviews',
    type: 'introduction',
    duration: 420, // 7 minutes in seconds

    sections: [
        {
            id: 'hook',
            title: 'The Hook',
            timing: '00:00 - 00:30',
            type: 'opening',
            description: 'Capture attention immediately with relatable pain point. Establish credibility. Promise insider knowledge.',

            visual: {
                id: 'hook-transition',
                title: 'LeetCode to Interview Transition',
                steps: 3
            },

            audio: {
                file: 'audio/hook-section.mp3',
                script: `You grind LeetCode for months. 
You solve 300+ problems. 
You finally get the interview at your dream company.

And then...

The interviewer says: 
"Great! Now design a payment processing system that handles 10,000 transactions per second."

You freeze. LeetCode didn't prepare you for THIS.

I'm Vladyslav, and I've been on BOTH sides of this exact scenario - as a candidate who failed, and as an interviewer at Visa watching candidates make the same mistakes over and over.`,
                wordCount: 85,
                estimatedDuration: 30
            },

            production: {
                pacing: 'fast',
                music: 'dramatic-tense',
                broll: [
                    'LeetCode profile screenshot',
                    'Zoom interview mockup'
                ],
                transitions: {
                    type: 'quick-fade',
                    duration: 0.5
                }
            }
        },

        {
            id: 'problem',
            title: 'The Problem',
            timing: '00:30 - 01:30',
            type: 'problem-definition',
            description: 'Define the gap between what people prepare (LeetCode) vs what\'s actually tested (production systems)',

            visual: {
                id: 'pie-chart',
                title: 'The 30/70 Split',
                steps: 3
            },

            audio: {
                file: 'audio/problem-section.mp3',
                script: `Here's the brutal truth most interview prep courses won't tell you:

LeetCode is only 30% of senior-level interviews.
The other 70%? 

Business logic implementation. 
Production-ready code.
System design.
Real-world trade-offs.

And here's what makes it worse - most courses CAN'T teach this properly because they've never:
- Processed millions of credit card transactions
- Debugged a race condition in production
- Explained technical decisions to non-technical stakeholders

I have. At Visa. At Klarna. In real interviews that I passed AND failed.

And I'm going to show you EXACTLY what they're looking for.`,
                wordCount: 110,
                estimatedDuration: 60
            },

            production: {
                pacing: 'medium',
                music: 'thoughtful-analytical',
                broll: [
                    'Pie chart animation',
                    'Comparison table slides'
                ],
                transitions: {
                    type: 'fade',
                    duration: 0.8
                }
            }
        },

        {
            id: 'killer1',
            title: 'Interview Killer #1: Business Logic',
            timing: '01:30 - 02:10',
            type: 'core-content',
            description: 'Show concrete example of what "business logic" means and why candidates fail',

            visual: {
                id: 'killer1-animation',
                title: 'The Implementation Gap',
                steps: 3
            },

            audio: {
                file: 'audio/killer1-section.mp3',
                script: `Interview Killer #1: Business Logic Implementation

The question seems simple: "Implement a money transfer system."

Most candidates jump straight to: HashMap, REST API, done.

But they miss:
- What if the database crashes AFTER debiting but BEFORE crediting?
- How do you prevent double-charging on network retry?
- What about concurrent transfers causing race conditions?

This is what I call the "Implementation Gap" - the space between solving the algorithm and building production-ready systems.

At Visa, I saw candidates with perfect algorithmic solutions fail this 80% of the time.`,
                wordCount: 90,
                estimatedDuration: 40
            },

            production: {
                pacing: 'medium-slow',
                music: 'building-tension',
                broll: [
                    'Code appearing with checkmarks',
                    'Red X animations on issues',
                    '80% fail counter'
                ],
                transitions: {
                    type: 'slide-left',
                    duration: 0.5
                }
            }
        },

        {
            id: 'killer2',
            title: 'Interview Killer #2: Deep Theory',
            timing: '02:10 - 02:50',
            type: 'core-content',
            description: 'Explaining concepts clearly under pressure - theory meets practice',

            visual: {
                id: 'killer2-animation',
                title: 'Theory Under Pressure',
                steps: 2
            },

            audio: {
                file: 'audio/killer2-section.mp3',
                script: `Interview Killer #2: Explaining Deep Theory

"Explain how a HashMap works internally."

Easy, right? Until they follow up with:

"What happens when you exceed the load factor?"
"Why is the resize operation O(n) amortized?"
"How does Java 8 handle hash collisions differently?"

The gap here isn't knowledge - it's the ability to explain complex concepts clearly under pressure.

This is where most senior candidates stumble. They KNOW the answer, but can't articulate it in interview conditions.`,
                wordCount: 80,
                estimatedDuration: 40
            },

            production: {
                pacing: 'medium',
                music: 'suspenseful',
                broll: [
                    'HashMap diagram',
                    'Follow-up questions appearing'
                ],
                transitions: {
                    type: 'fade',
                    duration: 0.5
                }
            }
        },

        {
            id: 'killer3',
            title: 'Interview Killer #3: System Design',
            timing: '02:50 - 03:30',
            type: 'core-content',
            description: 'Going beyond boxes and arrows in system design interviews',

            visual: {
                id: 'killer3-animation',
                title: 'Beyond Boxes and Arrows',
                steps: 2
            },

            audio: {
                file: 'audio/killer3-section.mp3',
                script: `Interview Killer #3: System Design Reality

"Design a URL shortener."

Everyone draws the same boxes: Load balancer, API, Database.

But senior interviews go deeper:
- How do you handle 100K shortened URLs per second?
- What's your cache invalidation strategy?
- Walk me through a failure scenario.

Drawing boxes is easy. Explaining the trade-offs between consistency and availability when your Redis cluster goes down? That's what separates senior from staff.

Most courses teach you to draw. I'll teach you to DEFEND.`,
                wordCount: 85,
                estimatedDuration: 40
            },

            production: {
                pacing: 'medium',
                music: 'epic-building',
                broll: [
                    'System design diagram',
                    'Deep-dive questions overlay'
                ],
                transitions: {
                    type: 'zoom',
                    duration: 0.6
                }
            }
        },

        {
            id: 'solution',
            title: 'Solution Preview',
            timing: '03:30 - 05:00',
            type: 'solution',
            description: 'Introduce SPIDER framework and 6 tasks that will transform interview performance',

            visual: {
                id: 'spider-framework',
                title: 'The SPIDER Framework',
                steps: 7
            },

            audio: {
                file: 'audio/solution-section.mp3',
                script: `Here's how we fix this.

I've developed the SPIDER Framework - a systematic approach to tackling any technical interview:

S - Scope: Clarify requirements before coding
P - Plan: Structure your solution verbally first  
I - Implement: Write production-quality code
D - Debug: Trace through edge cases
E - Evaluate: Discuss trade-offs honestly
R - Refine: Optimize with interviewer feedback

This course gives you 6 hands-on tasks that practice each element:

Task 1: Morris Traversal Deep Dive
Task 2: Rate Limiter Production System
Task 3: Payment Gateway with Saga Pattern
Task 4: Distributed Cache Architecture
Task 5: Event-Driven Microservices
Task 6: The Mock Interview Simulator

Each task is designed to close the gap between "knowing" and "demonstrating".`,
                wordCount: 130,
                estimatedDuration: 90
            },

            production: {
                pacing: 'energetic',
                music: 'hopeful-building',
                broll: [
                    'SPIDER acronym reveal',
                    'Task list animation',
                    'Framework diagram'
                ],
                transitions: {
                    type: 'reveal',
                    duration: 0.5
                }
            }
        },

        {
            id: 'proof',
            title: 'Social Proof',
            timing: '05:00 - 06:00',
            type: 'credibility',
            description: 'Why this course vs others + credibility markers',

            audio: {
                file: 'audio/proof-section.mp3',
                script: `Why should you trust me?

I've sat in over 100 interviews - on both sides of the table.

As a candidate: Failed at startups, passed at unicorns, joined Klarna.
As an interviewer: Evaluated 50+ candidates at Visa, saw every possible mistake.

This isn't theoretical. Every lesson comes from real interview experiences - my own failures, my candidates' struggles, and the patterns I've observed in successful hires.

Other courses teach you what to study.
This course teaches you how to PERFORM when it matters.`,
                wordCount: 90,
                estimatedDuration: 60
            },

            production: {
                pacing: 'sincere',
                music: 'inspirational',
                broll: [
                    'Credential logos (Visa, Klarna)',
                    'Interview count visualization'
                ],
                transitions: {
                    type: 'fade',
                    duration: 0.8
                }
            }
        },

        {
            id: 'cta',
            title: 'Call to Action',
            timing: '06:00 - 07:00',
            type: 'closing',
            description: 'Clear next steps + course structure overview',

            audio: {
                file: 'audio/cta-section.mp3',
                script: `Ready to close the gap?

Here's what happens next:

Watch Lesson 2 where we do a COMPLETE deep-dive on Morris Traversal - not just the algorithm, but how to explain it like a senior engineer.

Then tackle your first task: implement it yourself with production-quality code.

By the end of this course, you won't just know the answers.
You'll know how to DELIVER them like someone who's already working at these companies.

Because after 100+ interviews, I've learned:
The difference between getting an offer and getting rejected isn't what you know.
It's how you show what you know.

Let's begin.`,
                wordCount: 110,
                estimatedDuration: 60
            },

            production: {
                pacing: 'inspiring',
                music: 'triumphant-outro',
                broll: [
                    'Course roadmap',
                    'Next lesson preview'
                ],
                transitions: {
                    type: 'fade-to-black',
                    duration: 1.0
                }
            }
        }
    ]
};
