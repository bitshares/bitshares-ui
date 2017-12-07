import React from "react";
import LoadingIndicator from "./LoadingIndicator";

import steem from 'steem'
const query = {tag: 'bitshares.fdn',limit: 20};

const wrapper = {padding: "1rem 3rem"};
const pageTitle = {padding: "0.5rem 3rem", backgroundColor: "#1a2430"};

const alignRight = {textAlign: "right"};
const alignLeft = {textAlign: "left"};
const headerStyle = {backgroundColor: "#1a2430"};
const rowHeight = {height: "2em"};
const bodyRow = {backgroundColor: "#26384c"};
const bodyCell = {
    border: "3px solid #2e343c",
    padding: "0.5em 1em",
    lineHeight: "2rem",
};

const headerText = {color: "#ffffff", fontWeight: "bold"}
const leftCell = { ...alignLeft, ...bodyCell }
const rightCell = { ...alignRight, ...bodyCell }

const SomethingWentWrong = () => (
    <p>Ops... Something went wrong fetching the news</p>
);

const NewsTable = ({ data }) => {
    return (
        <table className="table">
            <thead style={headerStyle}>
                <tr>
                    <th style={rightCell}><span style={headerText}>LINE</span></th>
                    <th style={leftCell}><span style={headerText}>DATE</span></th>
                    <th style={leftCell}><span style={headerText}>SUBJECT</span></th>
                    <th style={leftCell}><span style={headerText}>AUTHOR</span></th>
                </tr>
            </thead>
            <tbody>
                {data.map((singleNews, iter) => {
                    const theAuthor = singleNews.parentAuthor ? singleNews.parentAuthor : singleNews.author
                    const formattedDate = singleNews.active
                    return(
                        <tr
                            style={bodyRow}
                            key={`${singleNews.title.slice(0,10)}${iter}`}
                        >
                            <td style={rightCell}>{iter+1}</td>
                            <td style={leftCell}>{formattedDate}</td>
                            <td style={leftCell}>
                                <a 
                                    href={`https://steemit.com${singleNews.url}`}
                                    rel="noreferrer noopener"
                                    target="_blank"
                                >{singleNews.title}</a></td>
                            <td style={leftCell}>{theAuthor}</td>
                        </tr>                    
                    )
                })}
            </tbody>
            <thead style={headerStyle}>
                <tr style={rowHeight}>
                    <th style={rightCell} />
                    <th style={leftCell} />
                    <th style={leftCell} />
                    <th style={leftCell} />
                </tr>
            </thead>
        </table>
    );
};

class News extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: true,
            isWrong: false,
            discussions: []
        }
    }

    componentDidMount() {
        steem.api.getDiscussionsByBlog(query, (err, discussions) => {
            if (err) this.setState({isLoading: false, isWrong: true})
            this.setState({discussions, isLoading: false})
        });
    }

    render() {
        const { isLoading, isWrong, discussions } = this.state
        
        return (
            <div className="grid-block page-layout">
                <div className="grid-block vertical">
                    <h2 style={pageTitle}>News</h2>
                    <div style={wrapper} className="grid-block vertical">
                        {isWrong && <SomethingWentWrong />}
                        {isLoading ? <LoadingIndicator /> : null}
                        {!isWrong && !isLoading && <NewsTable data={discussions}/>}
                    </div>
                </div>
            </div>
        );
    }
}

export default News;
