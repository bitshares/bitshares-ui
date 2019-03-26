import React from "react";

class Benchmark extends React.Component {
    static defaultProps = {};
    render() {
        return (
            <div className="grid-block vertical">
                <div className="grid-container">
                    <div className="grid-content" style={{paddingTop: "2rem"}}>
                        <img
                            src={`${__BASE_URL__}img/benchmark.png`}
                            style={{float: "left"}}
                        />

                        <p>
                            Benchmarking is available to projects which meet
                            common quality criteria determined by CryptoBridge
                            and DARC. Through this joint effort, we bring
                            greater attention to quality projects to provide
                            additional recognition in the crowded digital asset
                            space. Toward this end, DARC offers in-depth project
                            evaluations while CryptoBridge seeks to use its
                            visibility and position to support that service to
                            reinforce a shared, forward-leaning perspective.
                        </p>

                        <p>
                            Our collaborative purpose with benchmarking is to
                            recognize projects which meet or exceed a baseline
                            of fundamental quality. Citing the importance of
                            rigorous and objective assessment, we will work to
                            foster an environment which supports maturity from
                            within the digital asset landscape. Such an endeavor
                            will benefit project communities, currency and token
                            users, investors and associated enterprises.
                        </p>

                        <p>
                            A fee-based but unbiased evaluation is available and
                            conducted by DARC to determine projects which
                            sufficiently demonstrate that they are worthy of
                            benchmark status. Following its completion, a
                            supplemental report and other information then
                            becomes available on the evaluator’s website. A
                            smaller subset of common criteria will be confirmed
                            by CryptoBridge shortly after publication to
                            validate the results. Once the agreement is
                            finalized, the project’s status will recognized by
                            each member of the partnership on their websites and
                            associated social media outlets.
                        </p>

                        <p>
                            Upon benchmarking, projects will enjoy a range of
                            benefits: higher visibility on the trading
                            interface, a summary of their achievement
                            (publicized on social media and blogs) and increased
                            consumer and investor confidence. These projects
                            will be required to maintain or improve upon these
                            criteria in follow-up evaluations conducted
                            periodically to maintain benchmark status. This
                            process is designed to ensure objectivity and
                            transparency and all results will be communicated as
                            such.
                        </p>

                        <p>
                            We believe strongly that for the emergent
                            cryptocurrency and blockchain economies to be taken
                            as a serious and legitimate enterprise, all
                            participants must take action now to help guide it
                            in a positive direction. With our partnership we
                            wish to model perspectives, behaviors and methods
                            consistent with an increasing level of
                            sophistication and maturity. These improvements are
                            intended to be systemic in nature. We’re excited to
                            see what positive developments this endeavor will
                            kick-start, and we hope you’ll share our enthusiasm
                            in doing so.
                        </p>

                        <p>
                            To view the full range of DARC evaluations{" "}
                            <a
                                href="https://www.darc.network/research"
                                target={"_blank"}
                            >
                                click here
                            </a>.
                        </p>

                        <p>
                            For more information about having your project
                            reviewed, contact{" "}
                            <a href="mailto:benchmark@crypto-bridge.org">
                                benchmark@crypto-bridge.org
                            </a>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}

export default Benchmark;
